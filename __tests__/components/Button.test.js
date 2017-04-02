import React from 'react';
import renderer from 'react-test-renderer';
import Button from '../../src/components/Button.js'
import { shallow } from 'enzyme';

it('renders Button correctly', () => {
  const tree = renderer.create(
    <Button
    action="create"
    active={true}
    showPopup={() => {}}
    selectedRows={[]}
    key={1}>New</Button>
  ).toJSON();
  expect(tree).toMatchSnapshot();

  const obj = shallow(
    <Button
    action="create"
    active={true}
    showPopup={() => {}}
    selectedRows={[]}
    key={1}>New</Button>
  );

  obj.instance().shouldComponentUpdate({
    active: true,
    action: "edit"
  });

  obj.instance().onClick({
    target: {
      dataset: 'title'
    }
  });
});
