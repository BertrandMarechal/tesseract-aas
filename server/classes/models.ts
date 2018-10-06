export class Result {
    [name: string]: any;

    imgID: number = -1;
    codeVersion: string = '';
    paramsID: number = -1;
    detectedText: string = '';
    documentType: string = '';
    issuedBy: string = '';
    firstName: string = '';
    lastName: string = '';
    sex: string = '';
    nationality: string = '';
    dob: number = -1;
    dobChecksum: string = '';
    dobCheckPass: boolean | null = null;
    docExp: number = -1;
    docExpChecksum: string = '';
    docExpCheckPass: boolean | null = null;
    docNum: string = '';
    docNumChecksum: string = '';
    docNumCheckPass: boolean | null = null;
    documentChecksPass: boolean | null = null;

    constructor(consParams: any) {
        for (let key in consParams) {
            if (consParams.hasOwnProperty(key)) {
                this[key] = consParams[key];
            }
        }
    }
}

export interface Params {
    id: number;
    red: string;
    green: string;
    blue: string;
    opacity: string;
}

export interface Run {
    imgID: number;
    paramsID: number;
}

export interface FoundLineObj {
    text: string,
    index: number
}

export interface DocImage {
    id: number;
    expected_fields_id: number;
    s3_url: string;
    created_at: Date;
    created_by: string;
    updated_at: Date;
    updated_by: string;
}