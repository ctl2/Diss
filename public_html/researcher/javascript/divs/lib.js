function swapValues(object, key1, key2) {
    let temp = object[key1];
    object[key1] = object[key2];
    object[key2] = temp;
}
