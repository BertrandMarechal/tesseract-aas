import {ImageParser} from "./image-parser.model";

export class MrzChecker {
    static getNumericForString(strMRZwoCD: string) {
        const vals = [7, 3, 1];
        let sum = 0;
        for (let i = 0; i < strMRZwoCD.length; i++) {
            const d = strMRZwoCD.charCodeAt(i);
            sum = (sum + vals[i % 3] * (d === 60 ? 0 : d >= 65 && d <= 90 ? d - 65 : d - 48)) % 10;
        }
        return sum;
    }
    static checkMRZ(strMRZ: string, imageParser: ImageParser) {
        strMRZ = imageParser.convertToCharacter('char2Digit', strMRZ, true);
        const mrzRegxp = /^([0-9<]{7}|[A-Z0-9<]{10}|[A-Z0-9<]{13})$/;
        if (mrzRegxp.test(strMRZ)) {
            const len = strMRZ.length;
            const d = strMRZ.charCodeAt(len - 1);
            return MrzChecker.getNumericForString(strMRZ.substring(0, len - 1)) === (d === 60 ? 0 : d >= 65 && d <= 90 ? d - 65 : d - 48) % 10;
        }
        else {
            return null;
        }
    }

    static portugueseDocNumChecker(docNum: string, imageParser: ImageParser) {
        docNum = imageParser.convertToCharacter('char2Digit', docNum, true);
        const str = docNum.toString();
        let tot = 0;
        for (let i = 9; i > 0; i--) {
            tot += parseInt(str[9 - i]) * i;
        }
        return tot % 11 === 0;
    }
}