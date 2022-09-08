import fs from 'fs';

const generateIndex = (template) => {
    const templateFile = fs.readFileSync("./file-templates/index.txt", {encoding: 'utf8'});

    return eval("`"+templateFile+"`");
}

export default generateIndex