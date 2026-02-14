'use client';

import { useEffect, useState, forwardRef } from 'react';
import type { RigidBodyProps, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useErrors } from 'apps/web/contexts/Errors';

// RigidBody cannot be imported using dynamic() due to some import issues
export const DynamicRigidBody = forwardRef<RapierRigidBody, RigidBodyProps>(
  ({ children, ...props }, ref) => {
    const [RigidBodyDynamic, setRigidBody] = useState<typeof RigidBody>();
    const { logError } = useErrors();

    // Import needs to happen on render with async/await
    useEffect(() => {
      async function loadRigidBody() {
        try {
          const mod = await import('@react-three/rapier');
          setRigidBody(() => mod.RigidBody);
        } catch (error) {
          logError(error, 'Failed to load RigidBody');
        }
      }

      void loadRigidBody();
    }, [logError]);

    if (!RigidBodyDynamic) return null;

    return (
      <RigidBodyDynamic ref={ref} {...props}>
        {children}
      </RigidBodyDynamic>
    );
  },
);

DynamicRigidBody.displayName = 'DynamicRigidBody';

export default DynamicRigidBody;
