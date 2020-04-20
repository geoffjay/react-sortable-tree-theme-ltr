import React, { Component } from 'react';
import PropTypes from 'prop-types';

import NodeContentExpander from './node-content-expander';

import styles from './node-content-renderer.scss';

// Determine if a node is a descendant of another
function isDescendant(older, younger) {
  return (
    !!older.children &&
    typeof older.children !== 'function' &&
    older.children.some(
      child => child === younger || isDescendant(child, younger)
    )
  );
}

// Drag and drop content
function dndContent({
  buttons,
  canDrag,
  canDrop,
  className,
  connectDragPreview,
  isDraggedDescendant,
  isLandingPadActive,
  isSearchFocus,
  isSearchMatch,
  style,
  node,
  path,
  treeIndex,
  nodeTitle,
  nodeSubtitle,
}) {
  return connectDragPreview(
    <div
      className={
        styles.row +
        (isLandingPadActive ? ` ${styles.rowLandingPad}` : '') +
        (isLandingPadActive && !canDrop ? ` ${styles.rowCancelPad}` : '') +
        (isSearchMatch ? ` ${styles.rowSearchMatch}` : '') +
        (isSearchFocus ? ` ${styles.rowSearchFocus}` : '') +
        (className ? ` ${className}` : '')
      }
      style={{
        opacity: isDraggedDescendant ? 0.5 : 1,
        ...style,
      }}
    >
      <div
        className={
          styles.rowContents +
          (!canDrag ? ` ${styles.rowContentsDragDisabled}` : '')
        }
      >
        <div className={styles.rowLabel}>
          <span
            className={
              styles.rowTitle +
              (node.subtitle ? ` ${styles.rowTitleWithSubtitle}` : '')
            }
          >
            {typeof nodeTitle === 'function'
              ? nodeTitle({
                  node,
                  path,
                  treeIndex,
                })
              : nodeTitle}
          </span>

          {nodeSubtitle && (
            <span className={styles.rowSubtitle}>
              {typeof nodeSubtitle === 'function'
                ? nodeSubtitle({
                    node,
                    path,
                    treeIndex,
                  })
                : nodeSubtitle}
            </span>
          )}
        </div>

        <div className={styles.rowToolbar}>
          {buttons.map((btn, index) => (
            <div
              key={index} // eslint-disable-line react/no-array-index-key
              className={styles.toolbarButton}
            >
              {btn}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

class CustomThemeNodeContentRenderer extends Component {
  constructor(props) {
    super(props);

    const defaultRect = { left: 0, width: 0 };

    this.state = {
      containerRect: defaultRect,
      nodeRect: defaultRect,
      // XXX: testing something
      isLoaded: false,
    };

    this.containerRef = React.createRef();
    this.nodeRef = React.createRef();
    this.getRectsInterval = undefined;
  }

  componentDidMount() {
    // Polling for dimensions here because I couldn't find a better way to do it
    this.getRectsInterval = setInterval(() => {
      this.setState(state => {
        const containerRect = this.containerRef.current.getBoundingClientRect();
        return JSON.stringify(containerRect) !== JSON.stringify(state.containerRect) ? null : { containerRect };
      });
      this.setState(state => {
        const nodeRect = this.nodeRef.current.getBoundingClientRect();
        return JSON.stringify(nodeRect) === JSON.stringify(state.nodeRect) ? null : { nodeRect };
      });
      this.setState({ isLoaded: true });
    }, 10);

    this.height = this.state.nodeRect.height;
  }

  componentWillUnmount() {
    clearInterval(this.getRectsInterval);
  }

  render() {
    const {
      scaffoldBlockPxWidth,
      toggleChildrenVisibility,
      connectDragPreview,
      connectDragSource,
      isDragging,
      canDrop,
      canDrag,
      node,
      title,
      subtitle,
      draggedNode,
      path,
      treeIndex,
      isSearchMatch,
      isSearchFocus,
      icons,
      buttons,
      className,
      style,
      didDrop,
      lowerSiblingCounts,
      listIndex,
      swapFrom,
      swapLength,
      swapDepth,
      treeData,
      treeId, // Not needed, but preserved for other renderers
      isOver, // Not needed, but preserved for other renderers
      parentNode, // Needed for dndManager
      parentBoundingBox,
      ...otherProps
    } = this.props;

    // Calculate position and size information
    const { left, top, width, height } = this.state.nodeRect;
    // const left = this.state.containerRect.left + (this.state.containerRect.width / 2 - this.state.nodeRect.width / 2);

    // Attach to children?
    const boundingBox = {
      left,
      top,
      width,
      height,
    }

    node.boundingBox = boundingBox;

    // FIXME: use the real height from the component, this is just for testing
    //  need to attach real height, should just be from bounding box
    // node.height = 62 + Math.random() * 50;
    node.height = 62;

    // Custom node information
    const nodeTitle = title || node.title;
    const nodeSubtitle = subtitle || node.subtitle;
    const isDraggedDescendant = draggedNode && isDescendant(draggedNode, node);
    const isLandingPadActive = !didDrop && isDragging;

    // DnD content
    const nodeContent = dndContent({
      buttons,
      canDrag,
      canDrop,
      className,
      connectDragPreview,
      isDraggedDescendant,
      isLandingPadActive,
      isSearchFocus,
      isSearchMatch,
      style,
      node,
      path,
      treeIndex,
      nodeTitle,
      nodeSubtitle,
    });

    // TODO: either use parentBoundingBox directly or add it to node
    if (node.parentBoundingBox) {
      boundingBox.left = node.parentBoundingBox.left + node.parentBoundingBox.width;
    }

    const { isLoaded } = this.state;

    if (node.children) {
      node.children.forEach((child, index) => {
        // console.log(`node child: ${child}`);
        node.children[index].parentBoundingBox = boundingBox;
      });
    }

    let posX = 0;
    let posY = 0;
    if (node.boundingBox && node.parentBoundingBox) {
      posX = node.parentBoundingBox.left + node.parentBoundingBox.width;
      if (path.length === 2) {
        posX -= 14;
      } else if (path.length > 2) {
        posX += (path.length - 1) * scaffoldBlockPxWidth / 2;
        // posX -= 14;
      }

      if (node.parentBoundingBox.height) {
        posY = -node.parentBoundingBox.height * (path.length - 1);
      }
    }

    return (
      <div
        ref={this.containerRef}
        style={
          path.length === 1 ?
          { height: '100%' } :
          {
            height: '100%',
            position: 'absolute',
            left: posX,
            top: posY,
          }
        }
        {...otherProps}
      >
        {toggleChildrenVisibility &&
          node.children &&
          (node.children.length > 0 || typeof node.children === 'function') && (
            <NodeContentExpander
              node={node}
              scaffoldBlockPxWidth={scaffoldBlockPxWidth}
              width={width}
              path={path}
              treeIndex={treeIndex}
              isDragging={isDragging}
              isLoaded={node && isLoaded}
              parentBoundingBox={boundingBox}
              toggleChildrenVisibility={toggleChildrenVisibility}
            />
          )}

        <div
          ref={this.nodeRef}
          className={
            styles.rowWrapper +
            (!canDrag ? ` ${styles.rowWrapperDragDisabled}` : '')
          }
        >
          {canDrag
            ? connectDragSource(nodeContent, { dropEffect: 'copy' })
            : nodeContent}
        </div>
      </div>
    );
  }
}

CustomThemeNodeContentRenderer.defaultProps = {
  buttons: [],
  canDrag: false,
  canDrop: false,
  className: '',
  draggedNode: null,
  icons: [],
  isSearchFocus: false,
  isSearchMatch: false,
  parentNode: null,
  style: {},
  subtitle: null,
  swapDepth: null,
  swapFrom: null,
  swapLength: null,
  title: null,
  toggleChildrenVisibility: null,
  height: 62,
  parentBoundingBox: null,
};

CustomThemeNodeContentRenderer.propTypes = {
  buttons: PropTypes.arrayOf(PropTypes.node),
  canDrag: PropTypes.bool,
  className: PropTypes.string,
  icons: PropTypes.arrayOf(PropTypes.node),
  isSearchFocus: PropTypes.bool,
  isSearchMatch: PropTypes.bool,
  listIndex: PropTypes.number.isRequired,
  lowerSiblingCounts: PropTypes.arrayOf(PropTypes.number).isRequired,
  node: PropTypes.shape({
    children: PropTypes.array,
    expanded: PropTypes.bool,
    listIndex: PropTypes.number,
    subtitle: PropTypes.string,
    title: PropTypes.string,
    boundingBox: PropTypes.shape({
      left: PropTypes.number,
      width: PropTypes.number,
      top: PropTypes.number,
      height: PropTypes.number,
    }),
  }).isRequired,
  path: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,
  scaffoldBlockPxWidth: PropTypes.number.isRequired,
  style: PropTypes.shape({}),
  subtitle: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  swapDepth: PropTypes.number,
  swapFrom: PropTypes.number,
  swapLength: PropTypes.number,
  title: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  toggleChildrenVisibility: PropTypes.func,
  treeData: PropTypes.node.isRequired,
  treeId: PropTypes.string.isRequired,
  treeIndex: PropTypes.number.isRequired,

  // Drag and drop API functions
  // Drag source
  connectDragPreview: PropTypes.func.isRequired,
  connectDragSource: PropTypes.func.isRequired,
  didDrop: PropTypes.bool.isRequired,
  draggedNode: PropTypes.shape({}),
  isDragging: PropTypes.bool.isRequired,
  parentNode: PropTypes.shape({
    scaffoldBlockPxWidth: PropTypes.number,
  }), // Needed for dndManager
  // Drop target
  canDrop: PropTypes.bool,
  isOver: PropTypes.bool.isRequired,

  // Test
  height: PropTypes.number,
  parentBoundingBox: PropTypes.shape({
    left: PropTypes.number,
    width: PropTypes.number,
    top: PropTypes.number,
    height: PropTypes.number,
  }),
};

// Inform the tree of the node's current height
CustomThemeNodeContentRenderer.rowHeight = ({ ...props }) =>
   props.node.height ? props.node.height : 62
;

export default CustomThemeNodeContentRenderer;
