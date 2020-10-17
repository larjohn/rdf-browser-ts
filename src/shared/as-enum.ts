export function getEnumKeyByEnumValue(myEnum, enumValue) {
  const keys = Object.keys(myEnum).filter(x => myEnum[x] === enumValue);
  return keys.length > 0 ? myEnum[keys[0]] : null;
}
