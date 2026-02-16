declare module "wavesurfer.js/dist/plugins/regions.esm.js" {
  import type { default as WaveSurfer } from "wavesurfer.js";

  type Region = {
    id: string;
    start: number;
    end: number;
    remove: () => void;
  };

  type RegionsPlugin = {
    addRegion: (region: {
      id?: string;
      start: number;
      end: number;
      color?: string;
      drag?: boolean;
      resize?: boolean;
    }) => Region;
    getRegions: () => Region[];
    enableDragSelection: (options?: { color?: string }) => void;
    on: (event: "region-created", listener: (region: Region) => void) => void;
  };

  const RegionsPlugin: {
    create: () => RegionsPlugin;
  };

  export default RegionsPlugin;
}
