import { Buffer } from 'buffer';
export interface FileSystem {
  readFileSync(path: string, encoding?: string): Buffer | string;
  writeFileSync(path: string, text: string, encoding?: string): void;
}

let defaultFileSystem: FileSystem | undefined = undefined;
const ErrorNoFileSystem = new Error('please set the default FileSystem by call the setDefaultFileSystem');
export const setDefaultFileSystem = (fs?: FileSystem): void => {
  defaultFileSystem = fs;
};
export const getDefaultFileSystem = (): FileSystem | undefined => defaultFileSystem;
export const mustGetDefaultFileSystem = (): FileSystem => {
  if (defaultFileSystem) {
    return defaultFileSystem;
  }
  throw ErrorNoFileSystem;
};
