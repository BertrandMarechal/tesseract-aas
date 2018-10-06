import path from 'path';
import pythonShell from 'python-shell';
import { ImageParser } from './image-parser.model';
import { Result } from './models';
const tesseract = require('node-tesseract');
// import tesseract from 'node-tesseract';

export class Image {
    fileName: string = path.resolve(__dirname, '..', 'data', 'image.png');
    mrzFileName: string = path.resolve(__dirname, '..', 'data', 'mrz.png');

    constructor() {

    }

    private preProcessing(): Promise<any> {
        const pathTocropMrz = path.resolve(__dirname, '../python/mrz/detect_mrz.py');
        const pathToDeskew = path.resolve(__dirname, '../python/deskew/correct_skew.py');
        return new Promise((resolve, reject) => {
            pythonShell.run(pathToDeskew, {args: ['-i', this.fileName]}, (err: any) => {
                pythonShell.run(pathTocropMrz, {args: ['-i', this.fileName, '-o', this.mrzFileName]}, (err: any) => {
                    resolve();
                });
            });
        });
    }
    process() {
        const tessParams: { l?: string, config?: string } = {
            config: '-c tessedit_write_images=true',
            l: 'ocr'
        };
        return new Promise((resolve, reject) => {
            this.preProcessing()
                .then(() => {
                    tesseract.process(this.mrzFileName, tessParams, (err: any, data: any) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        
                        const imageParser = new ImageParser();
                        imageParser.parse(data, (error: string | null, parsedData: Result | null) => {
                            if (error) {
                                console.log(error);
                                
                                resolve();
                                return;
                            }
                            console.log(parsedData);
                            resolve(<Result>parsedData);
                        });
                    });
                })
                .catch((error) => {
                    console.log(error);
                });
        });
    }
}