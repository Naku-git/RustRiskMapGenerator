const inquirer = require("inquirer");
const { parse } = require('svg-parser');
const fs = require('fs');
const { resolve } = require("path");
const { rejects } = require("assert");

var neighborcontainer = [];
var neighbornamelist = [];
var tidgen = 1
var sqllist = [];

const territorypromise = new Promise((resolve, reject) => {
    fs.readFile('map.svg', function(err, data) {
        if (err) {
            console.error("Error reading file:", err);
            return;
        }
        const parsed = parse(data.toString());
        var territorycontainer = [];
        var territoriesFound = false;
        var id = 'Territories';
        for (const i of parsed.children[0].children) {
            if (i.properties.id === id) {
                territoriesFound = true;
                var regions = i.children;
                for (const region of regions) {
                    var regionName = region.properties.id;
                    var states = region.children;
                    for (const state of states) {
                        var territorydump;
                        territorydump = {name: state.properties.id, id: tidgen, region: regionName}
                        territorycontainer.push(territorydump);
                        neighbornamelist.push(state.properties.id);
                        tidgen = tidgen + 1;
                    }
                }
                console.log(territorycontainer);
                resolve(territorycontainer);
                
            }
        }
        if (!territoriesFound) {
            console.error("Error: No " + id + " element found in the SVG data.");
            process.exit(1);
        }
    })
})




const timer = (ms) => new Promise(res => setTimeout(res, ms))

const terrprompt = async (terrname) => {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: terrname,
            message: `List the neighbors of the territory ${terrname} (case insensitive, only list neighbors)`,
            validate(answer) {
                if (tempanscont.length === neighbors.length) {
                    for (const i of tempanscont) {
                        neighborcontainer.push([terrname, i]);
                    }
                    neighborcontainer.push([terrname, terrname]);
                    return true;
                } else {
                return 'One of the territories you entered either does not exist or was typed incorrectly (extra space somewhere also possible), please try again';
                }
            }
        }
    ]);

    const neighbors = JSON.stringify(answers);

    const confirmation = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'terrconfirmation',
            message: `You've inputted the following as neighbors of ${neighbors} ... is this correct?`
        }
    ]);

    return confirmation.terrconfirmation;
}


territorypromise.then(async (tcs) => {
    for (const i of tcs) {
        const terr = await terrprompt(i.name);
        if (!terr) {
            await terrprompt(i.name);
        }
        await timer(500);
    }
    for (const s of neighborcontainer) {
        for (const j of tcs) {
            if (s[0] === j.name) {
                s[0] = j.id;
            }
            if (s[1] === j.name) {
                s[1] = j.id;
            }
        }
    }
    for (const y of neighborcontainer) {
        sqllist.push(`INSERT INTO territory_adjacency(territory_id, adjacent_id) VALUES (${y[0]}, ${y[1]});`);
    }
    for (const t of tcs) {
        sqllist.push(`INSERT INTO territories (id, name, region) VALUES (${t.id}, '${t.name}', ${t.region});`)
    }
    fs.writeFile('output.txt', sqllist.join(`\n`), err => {
        if (err) {
            console.error(err)
            return;
        }
    })
})