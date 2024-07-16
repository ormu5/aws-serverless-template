import { Field, SqlParameter } from "@aws-sdk/client-rds-data";
import { TypeHint } from "@aws-sdk/client-rds-data";

type OptionalTypeHint = {
    typeHint?: TypeHint;
}

type SqlValue = string | number | boolean | object | (string | number | boolean | object)[];

/**
 * Represents user/developer-friendly mapping of database column names to column values for:
 * - Set of parameters submitted to these functions as part of a SQL query (select or upsert), where
 *     functions in this module encode this mapping to the Data API spec prior to submitting.
 * - Set of rows returned from a SQL query, where functions in this module decode the Data API response
 *     into this more accessible mapping.
 */
type SqlValuesType = Record<string, SqlValue>;

function encodeRows<T>(rowsList: T[]): SqlParameter[][] {
    return rowsList.map((row) => encodeRow(row));
}

function encodeRow<T>(row: T): SqlParameter[] {
    return Object.entries(row).map(([k, v]) => encodeItem(k, v));
}

function encodeParams(params: SqlValuesType): SqlParameter[] {
    if (params === undefined) { return [] }
    return Object.entries(params).map(([k, v]) => encodeItem(k, v));
}

function encodeItem<T>(name: string, value: T): SqlParameter {
    const [val, typeHint] = encodeValue(value);
    return { name: name, value: val, ...typeHint };
}

function decodeRows(records: Field[][], colNames: string[], colTypeNames: string[]): SqlValuesType[] {
    const results: SqlValuesType[] = [];
    records.forEach((record) => {
        const resultRow: SqlValuesType = {};
        record.forEach((val, idx) => {
            resultRow[colNames.at(idx)] = decodeValue(val, colTypeNames.at(idx));
        });
        results.push(resultRow as SqlValuesType);
    });

    return results;
}

function decodeValue(s: Field, colTypeName: string): SqlValue {
    const result = s.stringValue || s.longValue || s.doubleValue || s.booleanValue || (s.$unknown as unknown as string);
    return colTypeName=="JSON" ? JSON.parse(s.stringValue) as object : result
}

function encodeValue<T>(value: T): [Field, OptionalTypeHint?] {
    const valueType = typeof value;
    switch (valueType) {
        case 'string': {
            const result = { stringValue: value as unknown as string };
            if (containsDateTime(value as unknown as string)) {
                result['stringValue'] = result['stringValue'].replace('T', ' ');
                return [result, { typeHint: "TIMESTAMP" }];
            } else if (containsDate(value as unknown as string)) {
                return [result, {typeHint: "DATE"}];
            } else {
                return [result];
            }
        }
        case 'boolean': {
            return [{ booleanValue: Boolean(value) }];
        }
        case 'number': {
            if (Number.isInteger(value)) {
                return [{ longValue: Number(value) }];
            } else {
                return [{ doubleValue: Number(value) }];
            }
        }
        case 'object': {
            return [{ stringValue: JSON.stringify(value) }];
        }
    }

    // TODO (JDL): This needs to be vetted/adjusted to accommodate mysql....?
    if (Array.isArray(value)) {
        return [{ stringValue: JSON.stringify(value).replace('[', '{').replace(']', '}') }];
    } else if (value as unknown as string === 'IS NULL' || value === null) {
        return [{ isNull: true }];
    } else if (value as unknown as string === 'IS NOT NULL') {
        return [{ isNull: false }];
    }

    return [{ stringValue: String(value) }];
}

function containsDateTime(value: string): boolean {
    // Regular expression to match datetime format (YYYY-MM-DD HH:mm:ss)
    const datetimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    return datetimeRegex.test(value);
}

function containsDate(value: string): boolean {
    // Regular expression to match datetime format (YYYY-MM-DDTHH:mm:ss)
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}$/;
    return datetimeRegex.test(value);
}

export { encodeRow, encodeRows, decodeRows, encodeParams };
export type { SqlValuesType };
