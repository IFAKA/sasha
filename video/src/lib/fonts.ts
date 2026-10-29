import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadSerif} from '@remotion/google-fonts/InstrumentSerif';

export const SANS = loadInter('normal', {weights: ['500', '600', '700', '800'], subsets: ['latin']}).fontFamily;
export const SERIF = loadSerif('italic', {weights: ['400'], subsets: ['latin']}).fontFamily;
import {loadFont as loadFraunces} from '@remotion/google-fonts/Fraunces';
export const FRAUNCES = loadFraunces('normal', {weights: ['600', '700'], subsets: ['latin']}).fontFamily;
