import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createRequiredDirectories = () => {
  const dirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../temp')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } else {
      console.log(`Directory exists: ${dir}`);
    }
  });
};

export default createRequiredDirectories;
