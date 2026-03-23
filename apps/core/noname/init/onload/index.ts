import { DefaultSplash } from "./default-splash"
import type { OnloadSplash as IOnloadSplash } from "./onload-splash"
import { WideSplash } from "./wide-splash"

export const defaultSplashs: IOnloadSplash[] = [
  new DefaultSplash(),
  new WideSplash(),
]
