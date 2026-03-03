export function stripUnwantedFields(data: object[], fields: string[]) {
    return data.map((d) => {
        let result = {};

        fields.forEach((field) => {
            result[field] = d[field];
        })

        return result;
    })
}