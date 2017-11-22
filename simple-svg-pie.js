function factory () {
  const SIZE = 500

  /**
   * Applies attributes
   * @param {Element} el - html element
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
   * @returns {Object} Svg element
   */
  function createElementSVG (type) {
    return document.createElementNS('http://www.w3.org/2000/svg', type)
  }

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

  function interpolateData (oldValues, newValues, cb) {
    let steps = 100
    let coeffs = []
    let maxLength = Math.max(oldValues.length, newValues.length)
    let diffLength = oldValues.length - newValues.length

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
          oldValues.splice(-1, diffLength)
        }
        // Make oldValues array equal to newValues
        newValues.forEach((v, i) => { oldValues[i] = v })
        clearInterval(interval)
      }

      cb(oldValues)
    }, 10)
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
        let ds = calculateArcs(tempValues)
        let maxLength = Math.max(tempValues.length, this.arcs.length)
        for (let i = 0; i < maxLength; i++) {
          if (tempValues[i] !== undefined) {
            // There is a value to visualize
            if (this.arcs[i] === undefined) {
              // Value exist, but there's no arc
              let newArc = createElementSVG('path')
              setAttributesSVG(newArc, {
                stroke: `rgb(50,20,${i * 40}`,
                fill: `rgb(50,20,${i * 40})`
              })
              this.arcs.push(newArc)
              this.svg.appendChild(newArc)
            }
            // Just update
            setAttributesSVG(this.arcs[i], {
              d: ds[i]
            })
          } else {
            // Arc exist, but no value
            // Remove:
            this.arcs[i].remove()
            this.arcs.splice(i, 1)
          }
        }
        if (tempValues.length < this.arcs.length) {
          this.arcs.splice(-1, this.arcs.length - tempValues.length)
        }
      })
    }
  } // *class

  return SimplePie
}

window.SimplePie = factory()
