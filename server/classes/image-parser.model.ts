import {Result} from "./models";
import {MrzChecker} from "./mrz-checker.model";

export interface NumCharData {
    i_code_name: string;
    i_code_value: string;
}

export class ImageParser {
    //To contain array of non-number characters and the numbers they most closely resemble, same for leters
    chaMaps: {
        [name: string]: NumCharData[],
        char2Letter: NumCharData[],
        char2Digit: NumCharData[]
    } = {char2Letter: [], char2Digit: []};

    constructor() {
        this.chaMaps = {
            char2Digit: [
                {i_code_name: 'D', i_code_value: '0'},
                {i_code_name: 'o', i_code_value: '0'},
                {i_code_name: 'O', i_code_value: '0'},
                {i_code_name: 'u', i_code_value: '0'},
                {i_code_name: 'U', i_code_value: '0'},
                {i_code_name: 'l', i_code_value: '1'},
                {i_code_name: 'i', i_code_value: '1'},
                {i_code_name: 'I', i_code_value: '1'},
                {i_code_name: '‘', i_code_value: '1'},
                {i_code_name: '\'', i_code_value: '1'},
                {i_code_name: 'Z', i_code_value: '2'},
                {i_code_name: 'A', i_code_value: '4'},
                {i_code_name: 'L', i_code_value: '4'},
                {i_code_name: '\\\+', i_code_value: '4'},
                {i_code_name: 'S', i_code_value: '5'},
                {i_code_name: 'É', i_code_value: '6'},
                {i_code_name: 'Z', i_code_value: '8'},
                {i_code_name: '\\' + String.fromCharCode(63), i_code_value: '9'}],
            char2Letter: [
                {i_code_name: '0', i_code_value: 'O'},
                {i_code_name: '1', i_code_value: 'I'},
                {i_code_name: '2', i_code_value: 'Z'},
                {i_code_name: '4', i_code_value: 'A'},
                {i_code_name: '5', i_code_value: 'S'},
                {i_code_name: '8', i_code_value: 'B'},
            ]

        }
    }

    public parse(inputText: string, callback: (error: string | null, data: Result | null) => void) {
        let result: Result;
        const text: string[] = inputText.split("\n").filter(x => x.length > 25).map(x => x.replace(/[ ,.]/g, '').toUpperCase());
        if (text.length < 2) {
            return callback('Could not read text:\n' + inputText, null);
        }
        const lastLine = text[text.length - 1];
        const secondLastLine = text[text.length - 2];
        if (lastLine.length < 31 && lastLine.length > 25) {
            if (text.length < 3) {
                return callback('Could not read text.', null);
            }
            const thirdLastLine = text[text.length - 3];
            result = this.ocrID(thirdLastLine, secondLastLine, lastLine);
        }
        else if (lastLine[lastLine.length - 2] !== 'M' && lastLine[lastLine.length - 2] !== 'F') {
            result = this.ocrPassOrVisa(secondLastLine, lastLine);
        }
        else {
            result = this.ocrFrID(secondLastLine, lastLine);
        }
        // result.codeVersion = this.codeVersion;
        result.detectedText = inputText;
        return callback(null, result);
    }

    private ocrID(thirdLastLine: string, secondLastLine: string, lastLine: string): Result {
        const docNum: string = thirdLastLine.substr(5, 10);
        const indexOfSex: number = secondLastLine.substr(0, 12).search(/[MF<]/) > -1 ? secondLastLine.substr(0, 12).search(/[MF<]/) : 7;
        const dob: string = this.convertToCharacter('char2Digit', secondLastLine.substr(indexOfSex - 7, 7));
        const docExp: string = this.convertToCharacter('char2Digit', secondLastLine.substr(indexOfSex + 1, 7));
        const l_return: Result = new Result({
            documentType: thirdLastLine.substr(0, 2),
            issuedBy: thirdLastLine.substr(2, 3),
            dob: dob.substr(0, 6),
            dobChecksum: dob[6],
            docExp: docExp.substr(0, 6),
            docExpChecksum: docExp[6],
            docNum: docNum.substr(0, docNum.length - 1),
            docNumChecksum: docNum[docNum.length - 1],
            firstName: ImageParser.getName('first', lastLine),
            lastName: ImageParser.getName('last', lastLine),
            sex: secondLastLine[indexOfSex],
            nationality: thirdLastLine.substr(2, 3)
        });
        if (l_return.issuedBy === 'PRT') {
            l_return.docNumCheckPass = MrzChecker.portugueseDocNumChecker(docNum, this);
        }
        else {
            l_return.docNumCheckPass = MrzChecker.checkMRZ(docNum, this);
        }
        l_return.dobCheckPass = MrzChecker.checkMRZ(dob, this);
        l_return.docExpCheckPass = MrzChecker.checkMRZ(docExp, this);
        l_return.documentChecksPass = l_return.docExpCheckPass && l_return.dobCheckPass && l_return.docNumCheckPass;
        return l_return;
    }

    private ocrPassOrVisa(secondLastLine: string, lastLine: string): Result {
        const docNum: string = lastLine.substr(0, 10);
        const indexOfSex: number = lastLine.substr(13, 11).search(/[MF<]/) + 13 > -1 ? lastLine.substr(13, 11).search(/[MF<]/) + 13 : 20;
        const dob: string = this.convertToCharacter('char2Digit', lastLine.substr(indexOfSex - 7, 7));
        const docExp: string = this.convertToCharacter('char2Digit', lastLine.substr(indexOfSex + 1, 7));
        const l_return: Result = new Result({
            documentType: secondLastLine.substr(0, 2),
            issuedBy: secondLastLine.substr(2, 3),
            dob: dob.substr(0, 6),
            dobChecksum: dob[6],
            docExp: docExp.substr(0, 6),
            docExpChecksum: docExp[6],
            docNum: docNum.substr(0, docNum.length - 1),
            docNumChecksum: docNum[docNum.length - 1],
            firstName: ImageParser.getName('first', secondLastLine.substr(5)),
            lastName: ImageParser.getName('last', secondLastLine.substr(5)),
            sex: lastLine[indexOfSex],
            nationality: lastLine.substr(10, 3)
        });
        l_return.docNumCheckPass = MrzChecker.checkMRZ(docNum, this);
        l_return.dobCheckPass = MrzChecker.checkMRZ(dob, this);
        l_return.docExpCheckPass = MrzChecker.checkMRZ(docExp, this);
        l_return.documentChecksPass = l_return.docExpCheckPass && l_return.dobCheckPass && l_return.docNumCheckPass;
        return l_return;
    }

    private ocrFrID(secondLastLine: string, lastLine: string): Result {
        const docNum: string = lastLine.substr(0, 13);
        const dob: string = this.convertToCharacter('char2Digit', lastLine.substring(lastLine.length - 9, lastLine.length - 2));
        const indexOfSex: number = lastLine.substr(lastLine.length - 5).search(/[MF]/) > -1 ? lastLine.substr(lastLine.length - 5).search(/[MF]/) + lastLine.length - 5 : lastLine.length - 2;
        const l_return: Result = new Result({
            documentType: secondLastLine.substr(0, 2),
            issuedBy: secondLastLine.substr(2, 3),
            dob: dob.substr(0, 6),
            dobChecksum: dob[6],
            docNum: docNum.substr(0, docNum.length - 1),
            docNumChecksum: docNum[docNum.length - 1],
            firstName: lastLine.substring(13, lastLine.indexOf('<<')),
            lastName: secondLastLine.substring(5, secondLastLine.indexOf('<<')),
            sex: lastLine[indexOfSex],
            nationality: secondLastLine.substr(2, 3)
        });
        l_return.docNumCheckPass = MrzChecker.checkMRZ(docNum, this);
        l_return.dobCheckPass = MrzChecker.checkMRZ(dob, this);
        l_return.documentChecksPass = l_return.dobCheckPass && l_return.docNumCheckPass;
        return l_return;
    }

    public convertToCharacter(checkDirection: any, input: string, onlyLast?: boolean): string {
        // Only convert last char to digit if onlyLast flag set
        const original: string = input;
        if (onlyLast) {
            input = input[input.length - 1];
        }
        this.chaMaps[checkDirection].forEach((x: NumCharData) => {
            input = input.replace(new RegExp(x['i_code_name'], 'g'), x['i_code_value']);
        });
        return onlyLast ? original.substr(0, original.length - 1) + input : input;
    }

    private static getName(type: string, data: string): string {
        let name: string;
        switch (type) {
            case 'first':
                const findFrom: number = data.indexOf('<<');
                name = data.substring(findFrom, data.length - 1);
                break;
            case 'last':
                const findTo: number = data.indexOf('<<');
                name = data.substring(0, findTo);
                break;
            default:
                return type + ' name not recognised in ' + data;
        }
        name = name.replace(/<+/g, ' ').trim();
        name = name.substr(0, 25);
        return name;
    }
}