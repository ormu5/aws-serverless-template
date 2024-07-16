import { describe, expect, test } from '@jest/globals';
import { SqlParameter } from "@aws-sdk/client-rds-data";
import { encodeRows } from './dataApiUtil';

describe('Data API encodes objects with attributes', () => {
    test('Encodes a floating point number correctly', () => {
        const floatVal = 35.1;
        const records = [{ someFloat: floatVal }];
        const expectedResult: SqlParameter[] = [{ name: 'someFloat', value: { doubleValue: floatVal } }];
        expect(encodeRows(records).at(0)).toEqual(expectedResult);
    });
    test('Encodes an integer number correctly', () => {
        const intVal = 35;
        const records = [{ someInt: intVal }];
        const expectedResult: SqlParameter[] = [{ name: 'someInt', value: { longValue: intVal } }];
        expect(encodeRows(records).at(0)).toEqual(expectedResult);
    });
    test('Encodes an string correctly', () => {
        const strValue = 'blah';
        const records = [{ someStr: strValue }];
        const expectedResult: SqlParameter[] = [{ name: 'someStr', value: { stringValue: strValue } }];
        expect(encodeRows(records).at(0)).toEqual(expectedResult);
    });
    test('Encodes a date correctly', () => {
        const strValue = '2023-01-05';
        const records = [{ someStr: strValue }];
        const expectedResult: SqlParameter[] = [{ name: 'someStr', typeHint: 'DATE', value: { stringValue: strValue } }];
        expect(encodeRows(records).at(0)).toEqual(expectedResult);
    });
});
