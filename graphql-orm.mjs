import {getFieldType, getTypeMap} from 'graphql-to-sqlite-ddl';
import pluralize from 'pluralize';
import {snakeCase} from 'snake-case';

pluralize.addPluralRule('person', 'persons');

function getDefaultValue(value, type) {
  switch (type) {
    case 'Boolean':
      return value ? 'true' : 'false';
    case 'String':
      return `"${value}"`;
    case 'Int':
    case 'Float':
    default:
      return value;
  }
}

const typeToFields = type => {
  const defaultValues = new Map();

  type.fields.forEach(field => {
    const name = field.name.value;

    const isORMFields = /^(uuid|id|created_at|updated_at)$/.test(name);
    const isBelongs = /^belongsTo/.test(name);
    const isAssoicateTo = /^associateTo/.test(name);
    const isHasAndBelongsToMany = /^hasAndBelongsToMany/.test(name);
    if (isORMFields || isBelongs || isAssoicateTo || isHasAndBelongsToMany) return;

    const fieldType = getFieldType(field.type);

    field.directives.forEach(directive => {
      switch (directive.name.value) {
        case 'default':
          defaultValues.set(name, getDefaultValue(directive.arguments[0].value.value, fieldType));
          break;
        default:
      }
    });

    defaultValues.set(name, defaultValues.get(name));
  });

  return defaultValues;
};

const typeToFieldTypes = type => {
  const fieldTypes = new Map();

  type.fields.forEach(field => {
    const name = field.name.value;

    const isORMFields = /^(uuid|id|created_at|updated_at)$/.test(name);
    const isBelongs = /^belongsTo/.test(name);
    const isAssoicateTo = /^associateTo/.test(name);
    const isHasAndBelongsToMany = /^hasAndBelongsToMany/.test(name);
    if (isORMFields || isBelongs || isAssoicateTo || isHasAndBelongsToMany) return;

    const fieldType = getFieldType(field.type);
    const isNonNullType = field.type.kind === 'NonNullType';

    fieldTypes.set(name, fieldType + (isNonNullType ? '!' : ''));
  });

  return fieldTypes;
};

const typeToForeignKeys = type => {
  const result = new Map();
  const defaultValues = new Map();

  type.fields.forEach(field => {
    const name = field.name.value;

    const isBelongs = /^belongsTo/.test(name);
    const isAssoicateTo = /^associateTo/.test(name);
    if (isBelongs || isAssoicateTo) {
      const model = snakeCase((field.type.kind === 'NonNullType') ? field.type.type.name.value : field.type.name.value);
      let fk = `${pluralize.singular(model)}_id`;

      // check custom foreign key rather than model_id
      field.directives.forEach(directive => {
        switch (directive.name.value) {
          case 'foreignKey':
            fk = directive.arguments[0].value.value;
            break;
          case 'default':
            defaultValues.set(fk, directive.arguments[0].value.value);
            break;
          default:
        }
      });
      result.set(fk, pluralize.singular((field.type.kind === 'NonNullType') ? field.type.type.name.value : field.type.name.value));
    }
  });

  return {
    foreignKeys: result,
    defaultValues,
  };
};

const typeToBelongsToMany = type => {
  const result = [];

  type.fields.forEach(field => {
    const name = field.name.value;

    const isHasAndBelongsToMany = /^hasAndBelongsToMany/.test(name);
    if (isHasAndBelongsToMany) {
      result.push(pluralize.singular(field.type.name.value));
    }
  });

  return result;
};

const parseType = type => {
  const tableName = snakeCase(pluralize(type.name.value));
  const className = pluralize.singular(type.name.value);
  const defaultValues = typeToFields(type);
  const fieldTypes = typeToFieldTypes(type);

  const { belongsTo } = type;
  const { belongsToDefaultValue } = type;
  const hasMany = type.hasMany || [];
  const belongsToMany = typeToBelongsToMany(type);

  const codeFields = (Array.from(fieldTypes).length === 0) ? '' : `\n  static fields = new Map([
${Array.from(fieldTypes).map(x => `    ["${x[0]}", "${x[1]}"]`).join(',\n')}
  ]);`;
  const codeBelongsTo = (Array.from(belongsTo).length === 0) ? '' : `\n  static belongsTo = new Map([
${Array.from(belongsTo).map(x => `    ["${x[0]}", "${x[1]}"]`).join(',\n')}
  ]);`;
  const codeHasMany = (Array.from(hasMany).length === 0) ? '' : `\n  static hasMany = [
${Array.from(hasMany).map(x => `    ["${x[0]}", "${x[1]}"]`).join(',\n')}
  ];`;
  const codeBelongsToMany = (Array.from(belongsToMany).length === 0) ? '' : `\n  static belongsToMany = new Set([
${Array.from(belongsToMany).map(x => `    "${x}"`).join(',\n')}
  ]);`;

  return `import {Model} from "@lionrockjs/central";

export default class ${className} extends Model{
${Array.from(belongsTo.keys())
    .map(x => `  ${x} = ${belongsToDefaultValue.get(x) || 'null'};`)
    .join('\n')}${(Array.from(belongsTo.keys()).length > 0) ? '\n' : ''}${
    Array.from(defaultValues)
      .map(x => ((x[1] === undefined) ? `  ${x[0]} = null;` : `  ${x[0]} = ${x[1]};`)).join('\n')}

  static joinTablePrefix = '${snakeCase(className)}';
  static tableName = '${tableName}';
${codeFields}${codeBelongsTo}${codeHasMany}${codeBelongsToMany}
}
`;
};

const codeGen = schema => {
  const codes = new Map();
  const typeMap = getTypeMap(schema);

  // revserse belongs to and associate to create hasMany
  typeMap.forEach((atype, key) => {
    const type = atype;
    const { foreignKeys, defaultValues } = typeToForeignKeys(type);
    type.belongsTo = foreignKeys;
    type.belongsToDefaultValue = defaultValues;

    type.belongsTo.forEach((v, k) => {
      const t = typeMap.get(v) || typeMap.get(pluralize(v));
      t.hasMany = t.hasMany || [];
      t.hasMany.push([k, pluralize.singular(key)]);
    });
  });

  typeMap.forEach((type, key) => {
    codes.set(key, parseType(type));
  });

  return codes;
};

export default {
  codeGen
};