import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { HiOutlineMicrophone } from "react-icons/hi2";
import Marquee from "react-fast-marquee";
import { Button } from "@/components/ui/button";
import { GrPrevious, GrNext } from "react-icons/gr";
import axios from "axios";

const BannerSlider = () => {
  const [sliders, setSliders] = useState([]);
  const [api, setApi] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [sliderLoading, setSliderLoading] = useState(true);
  const [noticeLoading, setNoticeLoading] = useState(true);

  const BASE_URL = import.meta.env.VITE_API_URL;

  // ✅ Slider fetch
  const fetchSliders = async () => {
    try {
      setSliderLoading(true);

      const res = await axios.get(`${BASE_URL}/api/sliders`);
      console.log("Fetched sliders response:", res.data);

      let sliderData = [];

      // response যদি direct array হয়
      if (Array.isArray(res.data)) {
        sliderData = res.data;
      }
      // response যদি { data: [...] } হয়
      else if (Array.isArray(res.data?.data)) {
        sliderData = res.data.data;
      }
      // response যদি { sliders: [...] } হয়
      else if (Array.isArray(res.data?.sliders)) {
        sliderData = res.data.sliders;
      }

      setSliders(sliderData);
    } catch (err) {
      console.error(
        "Error fetching sliders:",
        err.response ? err.response.data : err.message,
      );
      setSliders([]);
    } finally {
      setSliderLoading(false);
    }
  };

  // ✅ Notice fetch
  const fetchNotice = async () => {
    try {
      setNoticeLoading(true);

      const res = await axios.get(`${BASE_URL}/api/notices`);
      console.log("Notice response:", res.data);

      if (typeof res.data === "string") {
        setTitle(res.data);
      } else if (res.data?.title) {
        setTitle(res.data.title);
      } else if (res.data?.data?.title) {
        setTitle(res.data.data.title);
      } else {
        setTitle("");
      }
    } catch (err) {
      console.error(
        "Fetch notice error:",
        err.response ? err.response.data : err.message,
      );
      setTitle("");
    } finally {
      setNoticeLoading(false);
    }
  };

  // ✅ initial load
  useEffect(() => {
    fetchSliders();
    fetchNotice();
  }, []);

  // ✅ carousel select listener
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };

    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // ✅ auto slide only when slider exists
  useEffect(() => {
    if (!api || sliders.length === 0) return;

    const interval = setInterval(() => {
      const nextIndex = (selectedIndex + 1) % sliders.length;
      api.scrollTo(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [api, selectedIndex, sliders]);

  // ✅ manual navigation
  const scrollTo = (index) => {
    if (!api || sliders.length === 0) return;
    api.scrollTo(index);
  };

  const handleNext = () => {
    if (sliders.length === 0) return;
    scrollTo((selectedIndex + 1) % sliders.length);
  };

  const handlePrevious = () => {
    if (sliders.length === 0) return;
    scrollTo((selectedIndex - 1 + sliders.length) % sliders.length);
  };

  return (
    <div className="relative w-full">
      {/* ✅ Slider Section */}
      {sliderLoading ? (
        <div className="w-full h-[160px] md:h-[160px] bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-gray-500 font-medium">Loading sliders...</span>
        </div>
      ) : sliders.length > 0 ? (
        <Carousel className="w-full" setApi={setApi}>
          <CarouselContent>
            {sliders.map((item, index) => (
              <CarouselItem key={item._id || index}>
                <div className="relative">
                  <img
                    className="w-full h-auto object-cover"
                    src={`${BASE_URL}${item.imageUrl}`}
                    alt={item.title || `Slide ${index + 1}`}
                    loading="lazy"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Prev / Next Buttons */}
          <div className="absolute inset-0 flex justify-between items-center px-4 h-full pointer-events-none">
            <Button
              onClick={handlePrevious}
              className="bg-transparent text-white text-2xl px-2 py-1 hover:scale-110 pointer-events-auto"
            >
              <GrPrevious />
            </Button>
            <Button
              onClick={handleNext}
              className="bg-transparent text-white text-2xl px-2 py-1 hover:scale-110 pointer-events-auto"
            >
              <GrNext />
            </Button>
          </div>
        </Carousel>
      ) : (
        <div className="w-full h-[120px] md:h-[150px] bg-gray-100 flex items-center justify-center border">
          <p className="text-gray-500 text-sm md:text-base font-medium">
            No slider available
          </p>
        </div>
      )}

      {/* ✅ Notice Bar */}
      <div className="px-3 opacity-90 text-black bg-white w-full py-1">
        <div className="flex items-center gap-4">
          <HiOutlineMicrophone className="text-xl md:text-2xl" />
          <Marquee className="text-xs md:text-sm">
            <ul className="flex items-center justify-between gap-20 font-bold">
              <li className="ms-8">
                {noticeLoading
                  ? "Loading notice..."
                  : title || "No active notice"}
              </li>
            </ul>
          </Marquee>
        </div>
      </div>
    </div>
  );
};

export default BannerSlider;
