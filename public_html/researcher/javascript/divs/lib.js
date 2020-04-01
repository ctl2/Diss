const LibNamespace = {};

LibNamespace.Slider = class {

    constructor(id, start, end) {
        let range = end - start;
        let filterPips = (value, type) => (
            value % (range / 10) !== 0?
            0:
            value % (range / 2) !== 0?
            2:
            1
        );
        this.element = document.getElementById(id);
        noUiSlider.create(
            this.element, {
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
    }

    replaceListener(eventName, handler, params) {
        this.element.noUiSlider.on(
            eventName,
            (values, handleIndex) => handler(values, handleIndex, ...params)
        );
    }

    getValue(handleIndex) {
        return this.element.noUiSlider.get()[handleIndex];
    }

}

LibNamespace.ProgressBar = class {

    constructor(id) {
        this.element = document.getElementById(id);
        this.bar = new ProgressBar.Line(this.element, {
            color: '#3a3a3a',
            strokeWidth: "4",
            trailColor: '#444444',
            duration: 400,
            from: {
                color: '#822'
            },
            to: {
                color: '#282'
            },
            step: function(state, circle, attachment) {
                circle.path.setAttribute('stroke', state.color);
            },
            text: {
                value: '0',
                style: {
                    color: '#efe',
                    position: 'absolute',
                    left: '1%',
                    top: '10%',
                    padding: 0,
                    margin: 0
                }
            }
        });
    }

}
