function setupSlider(id, start, end, onchange) {
    let range = end - start;
    let filterPips = (value, type) => (
        value % (range / 10) !== 0?
        0:
        value % (range / 2) !== 0?
        2:
        1
    );
    let element = document.getElementById(id);
    noUiSlider.create(
        element, {
            start: [start, end],
            connect: true,
            step: range / 20,
            margin: range / 20,
            range: {
                'min': start,
                'max': end
            },
            behaviour: 'tap',
            format: {
                to: (number) => "" + Math.floor(number),
                from: (string) => Number(string)
            },
            pips: {
                mode: 'steps',
                filter: filterPips,
                density: 5
            }
        }
    );
    element.noUiSlider.on("slide", onchange);
}
