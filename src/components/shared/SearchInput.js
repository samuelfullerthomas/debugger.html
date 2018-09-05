/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import React, { Component } from "react";

import { CloseButton } from "./Button";

import Svg from "./Svg";
import classnames from "classnames";
import "./SearchInput.css";

const arrowBtn = (onClick, type, className, tooltip) => {
  const props = {
    className,
    key: type,
    onClick,
    title: tooltip,
    type
  };

  return (
    <button {...props}>
      <Svg name={type} />
    </button>
  );
};

type Props = {
  count: number,
  expanded: boolean,
  handleClose: (e: SyntheticMouseEvent<HTMLDivElement>) => void,
  handleNext?: (e: SyntheticMouseEvent<HTMLButtonElement>) => void,
  handlePrev?: (e: SyntheticMouseEvent<HTMLButtonElement>) => void,
  hasPrefix?: boolean,
  onBlur?: (e: SyntheticFocusEvent<HTMLInputElement>) => void,
  onChange: (e: SyntheticInputEvent<HTMLInputElement>) => void,
  onFocus?: (e: SyntheticFocusEvent<HTMLInputElement>) => void,
  onKeyDown: (e: SyntheticKeyboardEvent<HTMLInputElement>) => void,
  onKeyUp?: (e: SyntheticKeyboardEvent<HTMLInputElement>) => void,
  onHistoryScroll?: (historyValue: string) => void,
  placeholder: string,
  query: string,
  selectedItemId?: string,
  shouldFocus?: boolean,
  showErrorEmoji: boolean,
  size: string,
  summaryMsg: string,
  showClose: boolean
};

type State = {
  inputFocused: boolean,
  historyPosition: number,
  history: Array<string>
};

class SearchInput extends Component<Props, State> {
  displayName: "SearchInput";
  $input: ?HTMLInputElement;

  static defaultProps = {
    expanded: false,
    hasPrefix: false,
    selectedItemId: "",
    size: "",
    showClose: true
  };

  constructor(props: Props) {
    super(props);

    this.state = {
      inputFocused: false,
      historyPosition: 0,
      history: []
    };
  }

  componentDidMount() {
    this.setFocus();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.shouldFocus && !prevProps.shouldFocus) {
      this.setFocus();
    }
  }

  setFocus() {
    if (this.$input) {
      const input = this.$input;
      input.focus();

      if (!input.value) {
        return;
      }

      // omit prefix @:# from being selected
      const selectStartPos = this.props.hasPrefix ? 1 : 0;
      input.setSelectionRange(selectStartPos, input.value.length + 1);
    }
  }

  renderSvg() {
    const svgName = this.props.showErrorEmoji ? "sad-face" : "magnifying-glass";
    return <Svg name={svgName} />;
  }

  renderArrowButtons() {
    const { handleNext, handlePrev } = this.props;

    return [
      arrowBtn(
        handlePrev,
        "arrow-up",
        classnames("nav-btn", "prev"),
        L10N.getFormatStr("editor.searchResults.prevResult")
      ),
      arrowBtn(
        handleNext,
        "arrow-down",
        classnames("nav-btn", "next"),
        L10N.getFormatStr("editor.searchResults.nextResult")
      )
    ];
  }

  onFocus = (e: SyntheticFocusEvent<HTMLInputElement>) => {
    const { onFocus } = this.props;

    this.setState({ inputFocused: true });
    if (onFocus) {
      onFocus(e);
    }
  };

  onBlur = (e: SyntheticFocusEvent<HTMLInputElement>) => {
    const { onBlur } = this.props;

    this.setState({ inputFocused: false });
    if (onBlur) {
      onBlur(e);
    }
  };

  onKeyDown = (e: any) => {
    const { onHistoryScroll, onKeyDown } = this.props;
    if (!onHistoryScroll) {
      return onKeyDown(e);
    }

    if (e.key === "ArrowUp") {
      const currentPosition = this.state.historyPosition;
      const previous = currentPosition - 1;
      const previousInHistory = this.state.history[previous];
      if (previousInHistory !== undefined) {
        e.preventDefault();
        this.setState({ historyPosition: previous });
        onHistoryScroll(previousInHistory);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      const currentPosition = this.state.historyPosition;
      const next = currentPosition + 1;
      const nextInHistory = this.state.history[next];
      if (nextInHistory !== undefined) {
        this.setState({ historyPosition: next });
        onHistoryScroll(nextInHistory);
      }
      return;
    }
    if (e.key === "Enter") {
      const newHistory = this.state.history;
      const inputValue = e.target.value;
      const previousIndex = newHistory.indexOf(inputValue);
      if (previousIndex !== -1) {
        newHistory.splice(previousIndex, 1);
      }
      newHistory.push(inputValue);
      this.setState({
        history: newHistory,
        historyPosition: newHistory.length - 1
      });
      return onKeyDown(e);
    }
  };

  renderSummaryMsg() {
    const { summaryMsg } = this.props;

    if (!summaryMsg) {
      return null;
    }

    return <div className="summary">{summaryMsg}</div>;
  }

  renderNav() {
    const { count, handleNext, handlePrev } = this.props;
    if ((!handleNext && !handlePrev) || (!count || count == 1)) {
      return;
    }

    return (
      <div className="search-nav-buttons">{this.renderArrowButtons()}</div>
    );
  }

  render() {
    const {
      expanded,
      handleClose,
      onChange,
      onKeyUp,
      placeholder,
      query,
      selectedItemId,
      showErrorEmoji,
      size,
      showClose
    } = this.props;

    const inputProps = {
      className: classnames({
        empty: showErrorEmoji
      }),
      onChange,
      onKeyDown: e => this.onKeyDown(e),
      onKeyUp,
      onFocus: e => this.onFocus(e),
      onBlur: e => this.onBlur(e),
      "aria-autocomplete": "list",
      "aria-controls": "result-list",
      "aria-activedescendant":
        expanded && selectedItemId ? `${selectedItemId}-title` : "",
      placeholder,
      value: query,
      spellCheck: false,
      ref: c => (this.$input = c)
    };

    return (
      <div
        className={classnames("search-shadow", {
          focused: this.state.inputFocused
        })}
      >
        <div
          className={classnames("search-field", size)}
          role="combobox"
          aria-haspopup="listbox"
          aria-owns="result-list"
          aria-expanded={expanded}
        >
          {this.renderSvg()}
          <input {...inputProps} />
          {this.renderSummaryMsg()}
          {this.renderNav()}
          {showClose && (
            <CloseButton handleClick={handleClose} buttonClass={size} />
          )}
        </div>
      </div>
    );
  }
}

export default SearchInput;
