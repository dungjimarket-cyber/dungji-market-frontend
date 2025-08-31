import { Suspense } from 'react';
import CreateFormV2 from './CreateFormV2';

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <CreateFormV2 />
        </Suspense>
      </div>
    </div>
  );
}
