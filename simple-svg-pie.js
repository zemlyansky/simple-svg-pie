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

  class SimplePie {
    constructor (params) {
      // Store data internally
      this.values = Array.from(params.values)
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
      svg.className = 'svg-pie-elemen'
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
    } // *constructor

    update (params) {
      console.log('UPDATING')
    }
  } // *class

  return SimplePie
}

window.SimplePie = factory()
