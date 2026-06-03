import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  it('renders title, message, and both action labels when visible', () => {
    const { getByText } = render(
      <ConfirmModal
        visible
        title="Leave Game?"
        message="Are you sure?"
        confirmLabel="Leave Game"
        cancelLabel="Stay"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(getByText('Leave Game?')).toBeTruthy();
    expect(getByText('Are you sure?')).toBeTruthy();
    expect(getByText('Leave Game')).toBeTruthy();
    expect(getByText('Stay')).toBeTruthy();
  });

  it('uses "Cancel" as the default cancel label', () => {
    const { getByText } = render(
      <ConfirmModal
        visible
        title="Title"
        message="Body"
        confirmLabel="Yes"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(getByText('Cancel')).toBeTruthy();
  });

  it('invokes onConfirm when the confirm button is pressed', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    const { getByText } = render(
      <ConfirmModal
        visible
        title="T"
        message="M"
        confirmLabel="Go"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(getByText('Go'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('invokes onCancel when the cancel button is pressed', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    const { getByText } = render(
      <ConfirmModal
        visible
        title="T"
        message="M"
        confirmLabel="Go"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disables both buttons while loading', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    const { getByText } = render(
      <ConfirmModal
        visible
        title="T"
        message="M"
        confirmLabel="Go"
        loading
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(getByText('Go'));
    fireEvent.press(getByText('Cancel'));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
