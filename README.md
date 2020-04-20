# React Sortable Tree LTR Theme

[WIP] Don't use this

## Features

* A tree that opens to the right, only to the right, doesn't support `rtl` mode

## Usage

Don't.

```sh
npm install --save react-sortable-tree-theme-ltr
```

```jsx
import React, { Component } from 'react';
import SortableTree from 'react-sortable-tree';
import LtrTheme from 'react-sortable-tree-theme-ltr';

export default class Tree extends Component {
  constructor(props) {
    super(props);

    this.state = {
      treeData: [{ title: 'src/', children: [ { title: 'index.js' } ] }],
    };
  }

  render() {
    return (
      <div style={{ height: 400 }}>
        <SortableTree
          treeData={this.state.treeData}
          onChange={treeData => this.setState({ treeData })}
          theme={LtrTheme}
        />
      </div>
    );
  }
}
```
