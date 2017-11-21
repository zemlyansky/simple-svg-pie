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
    for (let i = 0; i < maxLength; i++) {
      let n = (newValues[i] !== undefined) ? newValues[i] : 0
      let o = (oldValues[i] !== undefined) ? oldValues[i] : 0
      coeffs.push((n - o) / steps)
    }
    console.log(oldValues)
    let interval = setInterval(() => {
      console.log('processing step: ', steps)
      for (let i = 0; i < maxLength; i++) {
        if (oldValues[i] === undefined) {
          oldValues.push(coeffs[i])
        } else if (oldValues[i] < 0) {
          oldValues.splice(i, 1)
        } else {
          oldValues[i] = oldValues[i] + coeffs[i]
        }
      }

      steps -= 1
      if (steps <= 0) {
        clearInterval(interval)
        oldValues = newValues
      }

      cb(oldValues)
    }, 10)
  }

  class SimplePie {
    constructor (params) {
      // Store data internally
      this.oldValues = this.values = Array.from(params.values)
      this.labels = params.labels ? Array.from(params.labels) : []

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
      let svg = createElementSVG('svg')
      setAttributesSVG(svg, {
        viewBox: `0 0 ${SIZE} ${SIZE}`,
        preserveAspectRatio: 'xMinYMin meet'
      })
      svg.style.cssText = `
        display: inline-block;
        position: absolute;
        top: 10px;
        left: 0;
      `

      // Append SVG element to the container
      container.appendChild(svg)
      // Append the container to a parent element
      document
        .querySelector(params.parent)
        .appendChild(container)

      interpolateData([10,5,40], [100,20,15,5], function (tempValues) {
        console.log(calculateArcs(tempValues))
      })
    } // *constructor

    update () {
    
    }
  } // *class

  return SimplePie
}

window.SimplePie = factory()
