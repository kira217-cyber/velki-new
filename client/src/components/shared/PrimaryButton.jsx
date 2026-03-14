import { Button } from "@/components/ui/button";

const sizeConfig = {
  sm: {
    padding: "px-3 py-1",          // খুব কম height চাইলে এটা ব্যবহার করো
    icon: "text-base",
    text: "text-sm font-bold",     // বড় + bold
  },
  md: {
    padding: "px-4 py-1.5",        // height কমানোর জন্য py-2 থেকে py-1.5
    icon: "text-lg",
    text: "text-base font-extrabold",  // বড় ফন্ট + খুব bold
  },
  lg: {                            // যদি আরও বড় ফন্ট চাও তাহলে এটা যোগ করতে পারো
    padding: "px-5 py-2",
    icon: "text-xl",
    text: "text-lg font-black",
  },
};

export default function PrimaryButton({
  children,
  icon: Icon,
  background,
  size = "md",
}) {
  const { padding, icon, text } = sizeConfig[size] || sizeConfig.md;

  return (
    <Button
      className={`${
        background === "red"
          ? "bg-[#e20000] hover:bg-[#801616]"
          : "bg-[#8b6b05] hover:bg-[#534517]"
      } flex items-center justify-center gap-2 ${padding} rounded-md transition-colors`}
    >
      {Icon && <Icon className={icon} />}
      <span className={text}>{children}</span>
    </Button>
  );
}