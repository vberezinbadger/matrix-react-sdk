/*
Copyright 2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { render } from '@testing-library/react';
import React from 'react';

import DeviceSecurityCard from '../../../../../src/components/views/settings/devices/DeviceSecurityCard';
import { DeviceSecurityVariation } from '../../../../../src/components/views/settings/devices/filter';

describe('<DeviceSecurityCard />', () => {
    const defaultProps = {
        variation: DeviceSecurityVariation.Verified,
        heading: 'Verified session',
        description: 'nice',
    };
    const getComponent = (props = {}): React.ReactElement =>
        <DeviceSecurityCard {...defaultProps} {...props} />;

    it('renders basic card', () => {
        const { container } = render(getComponent());
        expect(container).toMatchSnapshot();
    });

    it('renders with children', () => {
        const { container } = render(getComponent({
            children: <div>hey</div>,
            variation: DeviceSecurityVariation.Unverified,
        }));
        expect(container).toMatchSnapshot();
    });
});
