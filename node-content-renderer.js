import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getNodeAtPath } from 'react-sortable-tree';

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
function DnDContent({
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

// eslint-disable-next-line react/prefer-stateless-function
class CustomThemeNodeContentRenderer extends Component {
  constructor(props) {
    super(props);

    const defaultRect = { left: 0, width: 0 };

    this.state = {
      containerRect: defaultRect,
      nodeRect: defaultRect
    };

    this.containerRef = React.createRef();
    this.nodeRef = React.createRef();
    this.getRectsInterval = undefined;
  }

  componentDidMount() {
    this.getRectsInterval = setInterval(() => {
      this.setState(state => {
        const containerRect = this.containerRef.current.getBoundingClientRect();
        return JSON.stringify(containerRect) !== JSON.stringify(state.containerRect) ? null : { containerRect };
      });
      this.setState(state => {
        const nodeRect = this.nodeRef.current.getBoundingClientRect();
        return JSON.stringify(nodeRect) === JSON.stringify(state.nodeRect) ? null : { nodeRect };
      });
    }, 10);
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
      zoom,
      ...otherProps
    } = this.props;

    // Calculate position and size information
    const width = `${this.state.nodeRect.width}px`
    const left = `${this.state.containerRect.left +
      this.state.containerRect.width / 2 -
      this.state.nodeRect.width / 2 
      }px`;

    // Custom node information
    const nodeTitle = title || node.title;
    const nodeSubtitle = subtitle || node.subtitle;
    const isDraggedDescendant = draggedNode && isDescendant(draggedNode, node);
    const isLandingPadActive = !didDrop && isDragging;

    // DnD content
    const nodeContent = DnDContent({
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
    })

    const pos = path.indexOf(parseInt(treeIndex, 10));
    const hasParent = path.length > 1
    const parentPath = path.length >= 1 ? path.slice(0, pos) : null;
    const parentNodeFromPath = getNodeAtPath({
      treeData,
      path: path.slice(0, pos),
      getNodeKey: ({ treeIndex: number }) => {
          return number;
      },
      ignoreCollapsed: true
    });

    console.log(treeData)
    console.log(node);
    console.log(`node left: ${left}`);
    console.log(`node width: ${width}`);
    console.log(`node index: ${treeIndex}`);
    console.log(`node path: ${path}`);
    console.log(`node position: ${pos}`);
    console.log(`node has parent: ${hasParent}`)
    console.log(`node parent path: ${parentPath}`);
    console.log(parentNodeFromPath);

    return (
      <div
        ref={this.containerRef}
        style={
          path.length === 1 ?
          { height: '100%', zoom } :
          { height: '100%', zoom, position: 'absolute', right: -1.0 * path.length * 400 - (0.1 * scaffoldBlockPxWidth), top: -62 * (path.length - 1) }  // XXX: couldn't explain why this is 0.1 if I had to
        }
        {...otherProps}
      >
        {toggleChildrenVisibility &&
          node.children &&
          (node.children.length > 0 || typeof node.children === 'function') && (
            <div>
              <button
                type="button"
                aria-label={node.expanded ? 'Collapse' : 'Expand'}
                className={
                  node.expanded ? styles.collapseButton : styles.expandButton
                }
                style={{ right: -0.75 * scaffoldBlockPxWidth }}
                onClick={() =>
                  toggleChildrenVisibility({
                    node,
                    path,
                    treeIndex,
                  })
                }
              />

              {node.expanded &&
                !isDragging && (
                  <div
                    style={{ width: scaffoldBlockPxWidth }}
                    className={styles.lineChildren}
                  />
                )}
            </div>
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
  zoom: 1,
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

  // Zooming test
  zoom: PropTypes.number,
};

export default CustomThemeNodeContentRenderer;
