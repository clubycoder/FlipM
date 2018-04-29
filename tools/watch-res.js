'use strict';

const program = require('commander');
const watch = require('watch');
const fs = require('fs');
const path = require('path');
const { 
  spawn, 
} = require('child_process');
const colors = require('colors');
const prettyData = require('pretty-data').pd;
const xml2js = require('xml2js');
const balanced = require('balanced-match');

const defaultEncoder = (() => {
  switch (process.platform) {
    case 'win32': return './gameplay3d/bin/windows/gameplay-encoder.exe';
    case 'darwin': return './gameplay3d/bin/macosx/gameplay-encoder';
    case 'linux': return './gameplay3d/bin/linux/gameplay-encoder';
  }
})();

program
  .version('0.1.0', '-v, --version')
  .option('-r, --res [dir]', 'Resource Directory [./res]', './res')
  .option('-e, --encoder [path]', `GamePlay3D Encoder Path [${defaultEncoder}]`, defaultEncoder)
  .parse(process.argv);

console.log("Flip'M Tools - Resource Watcher".bold.cyan);
console.log('======================================================================'.cyan);
console.log('Platform    : '.bold.magenta + process.platform.magenta);
console.log('Resource Dir: '.bold.magenta + program.res.magenta);
console.log('Encoder Path: '.bold.magenta + program.encoder.magenta);
console.log('...watching...'.cyan);

watch.createMonitor(program.res, function (monitor) {
  function formatLog(prefix, log, isError) {
    let formattedPrefix = prefix.bold.green;
    if (isError) {
      formattedPrefix = prefix.bold.red;
    }
    let formattedLog = '';
    log.trim().split("\n").forEach((line) => {
      let formattedLine = line.green;
      if (isError) {
        formattedLine = line.red;
      }
      formattedLog += formattedPrefix + formattedLine + "\n";
    });
    return formattedLog.trim();
  }

  function fixXML(f, base, ext, callback) {
    const xmlF = `${base}.xml`;
    fs.exists(xmlF, (exists) => {
      if (exists) {
        fs.readFile(xmlF, 'utf8', (err, data) => {
          if (err) {
            console.log(`FIX-XML-READ ERROR [${f}]: `.bold.red + $err.red);
            if (callback) {
              callback(err);
            }
          } else {
            const fixedXML = prettyData.xml(data);
            fs.writeFile(xmlF, fixedXML, (err) => {
              if (err) {
                console.log(`FIX-XML-WRITE ERROR [${f}]: `.bold.red + $err.red);
                if (callback) {
                  callback(err);
                }
              } else {
                console.log(`FIX-XML-WRITE DONE [${f}]`.bold.green);
                if (callback) {
                  callback(null);
                }
              }
            });
          }
        });
      }
    })
  }

  function convertXML2JSON(f, base, etx, callback) {
    const xmlF = `${base}.xml`;
    const jsonF = `${base}.json`;
    fs.exists(xmlF, (exists) => {
      if (exists) {
        fs.readFile(xmlF, 'utf8', (err, xmlD) => {
          if (err) {
            console.log(`CONVERT-XML-2-JSON-READ ERROR [${xmlF}]: `.bold.red + $err.red);
            if (callback) {
              callback(err);
            }
          } else {
            xml2js.Parser({
              'trim': true,
              'normalizeTags': true,
              'explicitRoot': false,
              'explicitArray': false
            }).parseString(xmlD, (err, json) => {
              fs.writeFile(jsonF, JSON.stringify(json, null, 2), (err) => {
                if (err) {
                  console.log(`CONVERT-XML-2-JSON-WRITE ERROR [${jsonF}]: `.bold.red + $err.red);
                  if (callback) {
                    callback(err);
                  }
                } else {
                  console.log(`CONVERT-XML-2-JSON DONE [${jsonF}]`.bold.green);
                  if (callback) {
                    callback(null);
                  }
                }
              });
            });
          }
        });
      }
    });
  }

  function encodeFBXXML(f, base, ext, callback) {
    const gpbF = `${base}.gpb`;
    const enc = spawn(program.encoder, ['-t', '-m', '-g:auto', '-oa', f, gpbF]);
    enc.stdout.on('data', (data) => {
      const out = data.toString('utf8');
      console.log(formatLog(`FBX-ENCODE-XML [${f}]: `, out, false));
    });
    enc.stderr.on('data', (data) => {
      const out = data.toString('utf8');
      console.log(formatLog(`FBX-ENCODE-XML-ERROR [${f}]: `, out, true));
    });
    enc.on('close', (code) => {
      if (code == 0) {
        console.log(`FBX-ENCODE-XML-DONE [${f}]`.bold.green);
        fixXML(f, base, ext, (err) => {
          if (err) {
            if (callback) {
              callback(err);
            }
          } else {
            convertXML2JSON(f, base, ext, (err) => {
              if (callback) {
                callback(err);
              }
            });
          }
        });
      } else {
        console.log(`FBX-ENCODE-XML-EXIT [${f}]: `.bold.red + $code.red);
        if (callback) {
          callback(code);
        }
      }
    });
  }

  function createScene(f, base, ext, callback) {
    const sceneF = `${base}.scene`;
    fs.exists(sceneF, (exists) => {
      if (!exists) {
        fs.writeFile(sceneF, `scene {
  path = ${base}.gpb
  ambientColor = 0, 0, 0
  physics {
    gravity = 0.0, -9.8, 0.0
  }
}`, (err) => {
          if (err) {
            console.log(`SCENE-WRITE ERROR [${base}]: `.bold.red + $err.red);
            if (callback) {
              callback(err);
            }
          } else {
            console.log(`SCENE-WRITE DONE [${base}]`.bold.green);
            if (callback) {
              callback(null);
            }
          }
        });
      } else {
        console.warn(`SCENE-WRITE SKIPPED [${base}]:`.bold.yellow);
        if (callback) {
          callback(null);
        }
      }
    });
  }

  function encodeFBXGPB(f, base, ext, callback) {
    const gpbF = `${base}.gpb`;
    const enc = spawn(program.encoder, ['-m', '-g:auto', '-oa', f, gpbF]);
    enc.stdout.on('data', (data) => {
      const out = data.toString('utf8');
      console.log(formatLog(`FBX-ENCODE [${f}]: `, out, false));
    });
    enc.stderr.on('data', (data) => {
      const out = data.toString('utf8');
      console.log(formatLog(`FBX-ENCODE-ERROR [${f}]: `, out, true));
    });
    enc.on('close', (code) => {
      if (code == 0) {
        console.log(`FBX-ENCODE-DONE [${f}]`.bold.green);
        if (f.indexOf('Board-') >= 0) {
          createScene(f, base, ext, (err) => {
            if (callback) {
              callback(err);
            }
          });
        } else {
          if (callback) {
            callback(null);
          }
        }
      } else {
        console.log(`FBX-ENCODE-EXIT [${f}]: `.bold.red + $code.red);
        if (callback) {
          callback(code);
        }
      }
    });
  }

  function getFBXDetails(f, base, ext, callback) {
    const jsonF = `${base}.json`;
    fs.exists(jsonF, (exists) => {
      if (exists) {
        fs.readFile(jsonF, 'utf8', (err, jsonD) => {
          if (err) {
            console.log(`FBX-DETAILS-JSON-READ ERROR [${jsonF}]: `.bold.red + $err.red);
            if (callback) {
              callback(err);
            }
          } else {
            const json = JSON.parse(jsonD);
            let numDirectionalLights = 0;
            let numPointLights = 0;
            let numSpotLights = 0;

            function countLights(node) {
              if (Array.isArray(node)) {
                node.forEach(countLights);
              } else {
                if (node.light) {
                  console.log(formatLog(`LIGHT[${node.$.id}]: `, JSON.stringify(node, null, 2), false));
                  switch (parseInt(node.light.lighttype)) {
                    case 1: {
                      numDirectionalLights++;
                    } break;
                    case 2: {
                      numPointLights++;
                    } break;
                    case 3: {
                      numSpotLights++;
                    } break;
                  }
                }
              }
            }
            countLights(json.scene.node);

            callback(null, {
              'numDirectionalLights': numDirectionalLights,
              'numPointLights': numPointLights,
              'numSpotLights': numSpotLights
            });
          }
        });
      } else {
        callback(null, {});
      }
    });
  }

  function configClean(config) {
    return config
      .trim()
      .replace(/\r/g, '')
      .replace(/\n\s*{/g, ' {')
    ;
  }

  function configParse(config) {
    function parseProps(lines) {
      const props = [];
      lines.forEach((line) => {
        const lineClean = line.trim();
        if (lineClean) {
          const lineParts = lineClean.split('=');
          const key = lineParts.shift().trim();
          const value = (lineParts.length > 0 ? lineParts.join('=').trim() : '');
          props.push({
            'key': key,
            'value': value
          });
        }
      });
      return props;
    }

    let props = [];
    const childeren = [];
    let rest = config;
    while (rest) {
      let parsed = balanced('{', '}', rest);
      if (!parsed) {
        props = props.concat(parseProps(rest.split("\n")));
        rest = '';
      } else {
        rest = parsed.post;
        const preLines = parsed.pre.split("\n");
        parsed.def = preLines.pop().trim();
        const preProps = parseProps(preLines);
        const postProps = (parsed.post && parsed.post.indexOf('{') < 0 ? parseProps(parsed.post.split("\n")) : []);
        props = props.concat(preProps, postProps);
        const parsedBody = configParse(parsed.body);
        parsed.props = parsedBody.props;
        parsed.childeren = parsedBody.childeren;
        childeren.push(parsed);
      }
    }
    const configParsed = {
      'props': props,
      'childeren': childeren
    };
    console.log("\n" + formatLog(`CONFIG: `, JSON.stringify(configParsed, null, 2), false));
    return configParsed;
  }

  function configFixAll(configParsed) {
    const resParentPath = path.dirname(path.resolve(program.res)) + '/';
    if (configParsed) {
      if (configParsed.props) {
        configParsed.props.forEach((prop) => {
          if (prop.value.indexOf(resParentPath) == 0) {
            prop.value = prop.value.substring(resParentPath.length);
          }
        });
      }
      if (configParsed.childeren) {
        configParsed.childeren.forEach((child) => {
          configFixAll(child);
        });
      }
    }
  }

  function configPropReplace(configParsed, key, value) {
    let found = false;
    configParsed.props.forEach((prop) => {
      if (prop.key == key) {
        prop.value = value;
        found = true;
      }
    });
    if (!found) {
      configParsed.props.push({
        'key': key,
        'value': value
      });
    }
  }

  function configPropAppend(configParsed, key, value) {
    let found = false;
    configParsed.props.forEach((prop) => {
      if (prop.key == key) {
        console.log("A");
        prop.value = (prop.value ? prop.value + '; ' : '') + value;
        found = true;
      }
    });
    if (!found) {
      console.log("B");
      configParsed.props.push({
        'key': key,
        'value': value
      });
    }
  }

  function configPropRemove(configParsed, key) {
    configParsed.props.forEach((prop) => {
      if (prop.key == key) {
        prop.key = '';
      }
    });
  }

  function configRebuild(configParsed, indent) {
    indent = (indent ? indent : '');
    let config = '';
    if (configParsed.props && configParsed.props.length > 0) {
      configParsed.props.forEach((prop) => {
        if (prop.key) {
          config += indent + prop.key;
          if (prop.value) {
            config += ' = ' + prop.value;
          }
          config += "\n";
        }
      });
    }
    if (configParsed.childeren && configParsed.childeren.length > 0) {
      configParsed.childeren.forEach((child) => {
        if (config) {
          config += "\n";
        }
        config += indent + child.def + " {\n";
        config += configRebuild(child, indent + '  ');
        config += indent + "}\n";
      });
    }
    return config;
  }

  function fixMaterial(f, base, ext, callback) {
    const materialF = `${base}.material`;
    fs.exists(materialF, (exists) => {
      if (exists) {
        fs.readFile(materialF, 'utf8', (err, materialD) => {
          if (err) {
            console.log(`FIX-MATERIAL-READ ERROR [${materialF}]: `.bold.red + $err.red);
            if (callback) {
              callback(err);
            }
          } else {
            const materialCleaned = configClean(materialD);
            const materials = configParse(materialCleaned);
            configFixAll(materials);

            // Parse the details including the light counts
            getFBXDetails(f, base, ext, (err, details) => {
              if (err) {
                if (callback) {
                  callback(err);
                }
              } else {
                // Build a set of pass defines for the lights
                let extraDefines = '';
                if (details.numDirectionalLights > 0) {
                  extraDefines = (extraDefines ? '; ' : '') + `DIRECTIONAL_LIGHT_COUNT ${details.numDirectionalLights}`;
                }
                if (details.numPointLights > 0) {
                  extraDefines = (extraDefines ? '; ' : '') + `POINT_LIGHT_COUNT ${details.numPointLights}`;
                }
                if (details.numSpotLights > 0) {
                  extraDefines = (extraDefines ? '; ' : '') + `SPOT_LIGHT_COUNT ${details.numSpotLights}`;
                }
                console.log(`FIX-MATERIAL [${materialF}]: `.bold.green + `extraDefines=${extraDefines}`);

                // Add the light defines to each pass
                // TODO: This may need some additional checks to not add light defines to materials not affected by lights
                if (extraDefines) {
                  if (materials.childeren) {
                    materials.childeren.forEach((material) => {
                      if (material.def.match(/^material .+:.+/) != null) {
                        console.log(formatLog(`MATERIAL: `, JSON.stringify(material, null, 2), false));
                        if (material.childeren) {
                          material.childeren.forEach((technique) => {
                            if (technique.def.match(/^technique/) != null) {
                              console.log(formatLog(`TECHNIQUE: `, JSON.stringify(technique, null, 2), false));
                              if (technique.childeren) {
                                technique.childeren.forEach((pass) => {
                                  if (pass.def.match(/^pass/) != null) {
                                    console.log(formatLog(`PASS-BEFORE: `, JSON.stringify(pass, null, 2), false));
                                    configPropAppend(pass, 'defines', extraDefines);
                                    console.log(formatLog(`PASS-AFTER: `, JSON.stringify(pass, null, 2), false));
                                  }
                                });
                              }
                            }
                          });
                        }
                      }
                    });
                  }
                }

                const materialFixed = configRebuild(materials);
                fs.writeFile(materialF, materialFixed, (err) => {
                  if (err) {
                    console.log(`FIX-MATERIAL-WRITE ERROR [${materialF}]: `.bold.red + $err.red);
                    if (callback) {
                      callback(err);
                    }
                  } else {
                    console.log(`FIX-MATERIAL DONE [${materialF}]`.bold.green);
                    if (callback) {
                      callback(null);
                    }
                  }
                });
              }
            });
          }
        });
      } else {
        if (callback) {
          callback(null);
        }
      }
    });
  }

  function encodeFBX(f, base, ext, callback) {
    encodeFBXXML(f, base, ext, (err) => {
      if (err) {
        if (callback) {
          callback(err);
        }
      } else {
        encodeFBXGPB(f, base, ext, (err) => {
          if (err) {
            if (callback) {
              callback(err);
            }
          } else {
            fixMaterial(f, base, ext, (err) => {
              if (err) {
                if (callback) {
                  callback(err);
                } else {
                  callback(null);
                }
              }
            });
          }
        });
      }
    });
  }

  function encodeTTF(f, base, etx, callback) {
    const gpbF = `${base}.gpb`;
    const enc = spawn(program.encoder, ['-p', '-f:b', '-s', '8,16,24,32,64,96', f, gpbF]);
    enc.stdout.on('data', (data) => {
      const out = data.toString('utf8');
      console.log(formatLog(`TTF-ENCODE [${f}]: `, out, false));
    });
    enc.stderr.on('data', (data) => {
      const out = data.toString('utf8');
      console.log(formatLog(`TTF-ENCODE-ERROR [${f}]: `, out, true));
    });
    enc.on('close', (code) => {
      if (code == 0) {
        console.log(`TTF-ENCODE-DONE [${f}]`.bold.green);
        if (callback) {
          callback(null);
        }
      } else {
        console.log(`TTF-ENCODE-EXIT [${f}]: `.bold.red + $code.red);
        if (callback) {
          callback(code);
        }
      }
    });
  }
  
  function createdOrChanged(f, stat) {
    const ext = path.extname(f).substring(1);
    const base = f.substring(0, f.length - (ext.length + 1));
    switch (ext.toUpperCase()) {
      case 'FBX': {
        console.log(`NEW/CHANGED [${ext.toUpperCase()}]: `.bold.cyan + `${base} - ${JSON.stringify(stat)}`.cyan);
        encodeFBX(f, base, ext);
        /*
        const enc = spawn(program.encoder, ['-t', '-m', '-g:auto', '-oa', f, `${base}.gpb`]);
        // const enc = spawn(program.encoder, ['-m', '-g:auto', '-oa', f, `${base}.gpb`]);
        enc.stdout.on('data', (data) => {
          console.log(`FBX-ENCODE [${f}]: ${data}`.green);
        });
        enc.stderr.on('data', (data) => {
          console.log(`FBX-ENCODE-ERROR [${f}]: ${data}`.red);
        });
        enc.on('close', (code) => {
          if (code == 0) {
            console.log(`FBX-ENCODE-DONE [${f}]`.green);
            fixXML(`${base}.xml`);
            if (f.indexOf('Board-') >= 0) {
              createScene(base);
            }
          } else {
            console.log(`FBX-ENCODE-EXIT [${f}]: ${code}`.red);
          }
        });
        */
      } break;
      case 'TTF': {
        console.log(`NEW/CHANGED [${ext.toUpperCase()}]: `.bold.cyan + `${base} - ${JSON.stringify(stat)}`.cyan);
        encodeTTF(f, base, ext);
        /*
        const enc = spawn(program.encoder, ['-p', '-f:b', '-s', '8,16,24,32,64,96', f, `${base}.gpb`]);
        enc.stdout.on('data', (data) => {
          console.log(`TTF-ENCODE [${f}]: ${data}`.green);
        });
        enc.stderr.on('data', (data) => {
          console.log(`TTF-ENCODE-ERROR [${f}]: ${data}`.red);
        });
        enc.on('close', (code) => {
          if (code == 0) {
            console.log(`TTF-ENCODE-DONE [${f}]`.green);
          } else {
            console.log(`TTF-ENCODE-EXIT [${f}]: ${code}`.red);
          }
        });
        */
      } break;
      default: {
        console.log(`IGNORING [${f}]`.grey);
      } break;
    }
  }

  function removed(f, stat) {
    const ext = path.extname(f).substring(1);
    const base = f.substring(0, f.length - (ext.length + 1));
    console.log(`REMOVED [${ext.toUpperCase()}]: `.bold.red + `${base} - ${stat}`.red);
    switch (ext.toUpperCase()) {
      case 'FBX': {
      } break;
      case 'TTF': {
      } break;
      default: {
        console.log(`IGNORING [${f}]`.grey);
      } break;
    }
  }

  monitor.on("created", createdOrChanged);
  monitor.on("changed", createdOrChanged);
  monitor.on("removed", removed);
});