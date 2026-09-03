import type {Metadata} from 'next';
import PrecedentApp from '@/components/precedent-app';

export const metadata:Metadata={title:'Team workspace · Scentira',robots:{index:false,follow:false}};
export default function TeamWorkspace(){return <PrecedentApp teamWorkspace/>;}
