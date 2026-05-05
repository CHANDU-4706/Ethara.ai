const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBADF') filelist = [...filelist, dirFile];
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'src', 'app', 'api'));
files.forEach(file => {
  if (file.endsWith('route.js')) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('export const dynamic')) {
      content = `export const dynamic = 'force-dynamic';\n\n` + content;
      fs.writeFileSync(file, content);
      console.log('Updated', file);
    }
  }
});
