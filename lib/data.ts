import fs from 'fs';
import path from 'path';

const lib : {baseDir:string, create:any, read:any} = {
  baseDir: path.resolve(__dirname, '../.data'),
  create: (dir:string, file:string, data:any, callback:(_:string|boolean)=>void) => {
    fs.open(`${lib.baseDir}/${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        const stringData = JSON.stringify(data);

        fs.writeFile(fileDescriptor, stringData, (writeErr) => {
          if (!writeErr) {
            callback(false);
          } else {
            callback('Could not write to file');
          }
        });
      } else {
        callback(`Could not create a new file, 
              it may lready exisst`);
      }
    });
  },
  read: (dir:string, file:string, callback:(_:any)=>void) => {
    fs.readFile(`${lib.baseDir}/${dir}/${file}.json`, 'utf-8', (readErr, data:any) => {
      if (!readErr) {
        callback(data);
      } else {
        callback(readErr);
      }
    });
  },
};

export default lib;
