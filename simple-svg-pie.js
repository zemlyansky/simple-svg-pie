function factory () {
  const SIZE = 300

  /**
   * Applies attributes
   * @param {DOMElement} el - html element
   * @param {Object} attrs - attributes to apply
   */
  function setAttributesSVG (el, attrs) {
    Object.keys(attrs).forEach((key) => {
      el.setAttributeNS(null, key, attrs[key])
    })
  }

  /**
   * Creates a new SVG element
   * @param {String} Type of svg element to create
   * @returns {Object} - svg element
   */
  function createElementSVG (type) {
    return document.createElementNS('http://www.w3.org/2000/svg', type)
  }

  /**
   * Calculate 'd' attributes for 'path' svg elements
   * @param {Number[]} values - array of values
   * @returns {String[]} - array of 'd' values
   */
  function calculateArcs (values) {
    let ds = []
    let oldX = 150 + 100 * (Math.cos(Math.PI / 2))
    let oldY = 150 - 100 * (Math.sin(Math.PI / 2))
    let totalAngle = 0
    for (let v of values) {
      let angle = 2 * Math.PI * v / 100
      totalAngle += angle
      let newX = 150 + 100 * (Math.cos(totalAngle - Math.PI / 2))
      let newY = 150 + 100 * (Math.sin(totalAngle - Math.PI / 2))
      ds.push(`M ${oldX} ${oldY} A 100 100 0 ${(angle < Math.PI) ? 0 : 1} 1 ${newX} ${newY} L 150 150 Z`)
      oldX = newX
      oldY = newY
    }
    return ds
  }

  function calculateMiddlePoints (values) {
    let ps = []
    let totalAngle = 0
    for (let v of values) {
      let angle = Math.PI * v / 100
      totalAngle += angle
      let newX = 150 + 80 * (Math.cos(totalAngle - Math.PI / 2))
      let newY = 150 + 80 * (Math.sin(totalAngle - Math.PI / 2))
      totalAngle += angle
      ps.push({x: newX, y: newY})
    }
    return ps
  }

  /**
   * Interpolate arrays of values with a fixed interval
   * @param {Number[]} oldValues
   * @param {Number[]} newValues
   * @param {Function} cb - callback function that runs each iteration
   */
  function interpolateData (oldValues, newValues, cb) {
    let steps = 100
    let coeffs = []
    let maxLength = Math.max(oldValues.length, newValues.length)
    let diffLength = oldValues.length - newValues.length
    console.log('diff: ', diffLength)

    for (let i = 0; i < maxLength; i++) {
      let n = (newValues[i] !== undefined) ? newValues[i] : 0
      let o = (oldValues[i] !== undefined) ? oldValues[i] : 0
      coeffs.push((n - o) / steps)
    }

    let interval = setInterval(() => {
      console.log('processing step: ', steps)
      for (let i = 0; i < maxLength; i++) {
        if (oldValues[i] === undefined) {
          oldValues.push(coeffs[i])
        } else {
          oldValues[i] = oldValues[i] + coeffs[i]
        }
      }

      steps -= 1
      if (steps <= 0) {
        // Clear empty-values
        if (diffLength > 0) {
          oldValues.splice(-diffLength)
        }
        // Make oldValues array equal to newValues
        newValues.forEach((v, i) => { oldValues[i] = v })
        clearInterval(interval)
      }

      cb(oldValues)
    }, 10)
  }

  /**
   * Scale values to have 100% sum
   * @param {Number[]} values
   * @returns {Number[]}
   */
  function normalizeValues (values) {
    let sum = values.reduce((sum, v) => sum + v, 0)
    return values.map((v) => v * 100 / sum)
  }

  class SimplePie {
    constructor (params) {
      // Store data internally
      this.oldValues = []
      this.values = Array.from(params.values)
      this.labels = params.labels ? Array.from(params.labels) : []
      this.arcs = []

      // Create SVG container
      let container = document.createElement('div')
      container.className = 'svg-pie-container'
      container.style.cssText = `
        display: inline-block;
        position: relative;
        width: 100%;
        padding-bottom: 100%;
        vertical-align: top;
        overflow: hidden;
      `

      // Create SVG element
      this.svg = createElementSVG('svg')
      setAttributesSVG(this.svg, {
        viewBox: `0 0 ${SIZE} ${SIZE}`,
        preserveAspectRatio: 'xMinYMin meet'
      })
      this.svg.style.cssText = `
        display: inline-block;
        position: absolute;
        top: 10px;
        left: 0;
      `

      // Append SVG element to the container
      container.appendChild(this.svg)
      // Append the container to a parent element
      document
        .querySelector(params.parent)
        .appendChild(container)

      this.update()
    } // *constructor

    update () {
      interpolateData(this.oldValues, this.values, (tempValues) => {
        let ds = calculateArcs(normalizeValues(tempValues))
        let ps = calculateMiddlePoints(normalizeValues(tempValues))
        console.log(tempValues)
        let maxLength = Math.max(tempValues.length, this.arcs.length)
        for (let i = 0; i < maxLength; i++) {
          if (tempValues[i] !== undefined) {
            // There is a value to visualize
            if (this.arcs[i] === undefined) {
              // Value exist, but there's no arc
              let g = createElementSVG('g')
              let newArc = createElementSVG('path')
              setAttributesSVG(newArc, {
                stroke: `rgb(50,20,${i * 40}`,
                fill: `rgb(50,20,${i * 40})`
              })
              let newLabel = createElementSVG('text')
              setAttributesSVG(newLabel, {
                fill: 'white',
                stroke: 'none',
                'text-anchor': 'middle',
                'font-size': '10px',
                'font-family': 'sans-serif'
              })
              g.appendChild(newArc)
              g.appendChild(newLabel)
              this.arcs.push(g)
              this.svg.appendChild(g)
            }
            // Just update
            setAttributesSVG(this.arcs[i].children[0], {
              d: ds[i]
            })
            setAttributesSVG(this.arcs[i].children[1], {
              x: ps[i].x,
              y: ps[i].y + 5
            })
            this.arcs[i].children[1].textContent = (+tempValues[i].toFixed(2)).toString()
          }
        }
        // Remove arcs we don't need anymore
        if (tempValues.length < this.arcs.length) {
          this.arcs
            // Changes this.arcs array, returns new array with elements to remove
            .splice(tempValues.length - this.arcs.length) 
            // Remove SVG elements
            .forEach((arc) => { arc.remove() }) 
        }
      }) // *interpolate callback
    } // *update()
  } // *class

  return SimplePie
}

window.SimplePie = factory()
