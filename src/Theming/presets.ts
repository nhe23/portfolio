export interface IPreset {
  name: string;
  colors: {
    [key: string]: string;
  }
}
export const presets:Array<IPreset> = [
  {
    name: "light",
    colors: {
      primary: "#1e77fd",
      secondary: "#ff6584",
      background: "#ffffff",
      textColorPrimary: "#ffffff"
    }
  },
  {
    name: "dark",
    colors: {
      text: "#f1f1f1",
      background: "#27323a"
    }
  }
];
