import { SelectCategory } from "@/components/Home/SelectCategory/SelectCategory";
import BannerSlider from "@/components/shared/BannerSlider";
import Footer from "@/components/shared/Footer";
const Home = () => {
  return (
    <div className="mt-14">
      <BannerSlider />
      <SelectCategory />
      <Footer />
    </div>
  );
};

export default Home;
