// LAZY_LOADED_BY_SUNNY
import dynamic from 'next/dynamic';

const Page = dynamic(() => import('./_page_impl'), {
  ssr: true,
  loading: () => null
});

export default Page;
