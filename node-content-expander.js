import React, { Component } from 'react';
import PropTypes from 'prop-types';

import styles from './node-content-expander.scss';

// TODO: figure out proper time to call this when everything is loaded
const getFullHeight = (node, parentBoundingBox) => {
  let fullHeight = 62;
  if (node && parentBoundingBox) {
    fullHeight = parentBoundingBox.height;
    if (node.expanded) {
      fullHeight = 0;
      if (node && node.children) {
        for (let i = 0; i < node.children.length; i += 1) {
          const child = node.children[i];
          fullHeight += child.height;
          console.log(`(${node.title} -> ${child.title}) added ${child.height} to get ${fullHeight}`);
        }
      }
    }
  }
  return fullHeight;
}

class NodeContentExpander extends Component {

  constructor(props) {
    super(props);

    this.state = {
      width: 100,
      height: props.node.boundingBox.height,
    };

    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.drawInterval = setInterval(() => {
      this.draw();
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this.drawInterval);
  }

  draw() {
    const { node } = this.props;

    const canvas = this.canvasRef.current;
    const context = canvas.getContext('2d');

    context.lineWidth = 2;
    context.strokeStyle = '#000000';

    if (!node.expanded) {
      // first section
      // --- +
      context.save();
      context.beginPath();
      context.moveTo(0, canvas.height / 2);
      context.lineTo(canvas.width / 2, canvas.height / 2);
      context.stroke();
      context.restore();
    }

    // child sections
    if (node.expanded && node.children) {
      // first section
      // --- +
      context.save();
      context.beginPath();
      // -10 here is to account for padding on parent container, should decide if BB should include that
      context.moveTo(0, node.children[0].parentBoundingBox.height / 2 - 10);
      context.lineTo(canvas.width / 2, node.children[0].parentBoundingBox.height / 2 - 10);
      context.stroke();
      context.restore();

      for (let i = 0; i < node.children.length; i += 1) {
        const child = node.children[i];
        // start lined up with the expander
        let childY = child.parentBoundingBox.height / 2 - 10;
        if (i > 0) {
          for (let j = i; j > 0; j -= 1) {
            childY += (node.children[j-1].boundingBox.height - 10) + (child.boundingBox.height / 2 - 20);
          }
        }
        context.save();
        context.beginPath();
        const startX = canvas.width / 2;
        const startY = child.parentBoundingBox.height / 2 - 10;
        const endX = canvas.width;
        const endY = childY;
        const p1X = startX + (endX - startX) / 2;
        const p1Y = startY;
        const p2X = p1X;
        const p2Y = endY;
        context.moveTo(startX, startY);
        context.bezierCurveTo(p1X, p1Y, p2X, p2Y, endX, endY);
        // XXX: just for testing, should be bezier
        context.lineTo(endX, childY);
        //
        context.stroke();
        context.restore();
      }
    }
  }

  render () {
    const { node,
      scaffoldBlockPxWidth,
      isDragging,
      isLoaded,
      toggleChildrenVisibility,
      path,
      parentBoundingBox,
      treeIndex,
    } = this.props;

    let fullHeight = parentBoundingBox.height;
    if (node.expanded) {
      fullHeight = 0;
      if (node && node.children) {
        for (let i = 0; i < node.children.length; i += 1) {
          const child = node.children[i];
          fullHeight += child.height;
          // console.log(`(${node.title} -> ${child.title}) added ${child.height} to get ${fullHeight}`);
        }
      }
    }
    this.state.height = fullHeight;
    // XXX: probably don't need the check here anymore
    const canvasHeight = !node.expanded ? parentBoundingBox.height - 20 : fullHeight - 20;

    return (
      isLoaded && <div>
        <button
          type="button"
          aria-label={node.expanded ? 'Collapse' : 'Expand'}
          className={
            node.expanded ? styles.collapseButton : styles.expandButton
          }
          style={{ position: 'absolute', right: -scaffoldBlockPxWidth }}
          onClick={() =>
            toggleChildrenVisibility({
              node,
              path,
              treeIndex,
            })
          }
        />
        <canvas
          ref={this.canvasRef}
          className={styles.expanderCanvas}
          width={this.state.width}
          height={`${canvasHeight}px`}
          style={{ left: parentBoundingBox.width - 10, top: 10, zIndex: -99 }}
        />

        {node.expanded &&
          !isDragging && (
            <div
              style={{ width: scaffoldBlockPxWidth }}
              // className={styles.lineChildren}
            />
          )}
      </div>
    );
  }
}

NodeContentExpander.defaultProps = {
  toggleChildrenVisibility: null,
  // parentBoundingBox: {
  //   left: 0,
  //   top: 0,
  //   width: 0,
  //   height: 0,
  // },
};

NodeContentExpander.propTypes = {
  node: PropTypes.shape({
    children: PropTypes.array.isRequired,
    expanded: PropTypes.bool.isRequired,
  }).isRequired,
  isDragging: PropTypes.bool.isRequired,
  isLoaded: PropTypes.bool.isRequired,
  scaffoldBlockPxWidth: PropTypes.number.isRequired,
  toggleChildrenVisibility: PropTypes.func,
  parentBoundingBox: PropTypes.shape({
    left: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  path: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,
  treeIndex: PropTypes.number.isRequired,
};

export default NodeContentExpander;
