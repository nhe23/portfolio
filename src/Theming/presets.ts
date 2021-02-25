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
      primaryDark: "#1A64D4",
      secondary: "#ff6584",
      background: "#ffffff",
      textColorPrimary: "#ffffff",
      light: "#e8eef3"
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
