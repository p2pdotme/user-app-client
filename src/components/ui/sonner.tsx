import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      richColors
      className="toaster group"
      style={
        {
          // base/default (aka normal)
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",

          // default alias
          "--default-bg": "var(--popover)",
          "--default-text": "var(--popover-foreground)",
          "--default-border": "var(--border)",

          // success/info/warning/error
          "--success-bg": "var(--success)",
          "--success-text": "var(--primary-foreground)",
          "--success-border": "var(--success)",

          "--info-bg": "var(--primary)",
          "--info-text": "var(--primary-foreground)",
          "--info-border": "var(--primary)",

          "--warning-bg": "var(--warning)",
          "--warning-text": "var(--primary-foreground)",
          "--warning-border": "var(--warning)",

          "--error-bg": "var(--destructive)",
          "--error-text": "var(--primary-foreground)",
          "--error-border": "var(--destructive)",

          // loading
          "--loading-bg": "var(--accent)",
          "--loading-text": "var(--accent-foreground)",
          "--loading-border": "var(--border)",

          // shape
          "--border-radius": "var(--radius-md)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "rounded-[var(--border-radius)] border border-[color:var(--normal-border)] bg-[var(--normal-bg)] text-[color:var(--normal-text)]",
          title: "font-medium",
          description: "text-sm opacity-90",
          success:
            "border-[color:var(--success-border)] bg-[var(--success-bg)] text-[color:var(--success-text)]",
          info: "border-[color:var(--info-border)] bg-[var(--info-bg)] text-[color:var(--info-text)]",
          warning:
            "border-[color:var(--warning-border)] bg-[var(--warning-bg)] text-[color:var(--warning-text)]",
          error:
            "border-[color:var(--error-border)] bg-[var(--error-bg)] text-[color:var(--error-text)]",
          loading:
            "border-[color:var(--loading-border)] bg-[var(--loading-bg)] text-[color:var(--loading-text)]",
          default:
            "border-[color:var(--default-border)] bg-[var(--default-bg)] text-[color:var(--default-text)]",
          closeButton: "hover:opacity-100 opacity-70",
          actionButton:
            "rounded-xs border border-transparent bg-transparent hover:bg-[var(--accent)] hover:text-[color:var(--accent-foreground)]",
          cancelButton:
            "rounded-xs border border-transparent bg-transparent hover:bg-[var(--muted)]",
          icon: "text-current",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
