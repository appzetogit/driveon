import { colors } from "../../module/theme/colors";
import carLogo1 from "../../assets/car_logo1_PNG1.png";
import carLogo2 from "../../assets/car_logo2_PNG.png";
import carLogo3 from "../../assets/car_logo3_PNG.png";
import carLogo4 from "../../assets/car_logo4_PNG.png";
import carLogo5 from "../../assets/car_logo5_PNG.png";
import carLogo6 from "../../assets/car_logo6_PNG.png";
import carLogo7 from "../../assets/car_logo7_PNG.png";
import carLogo8 from "../../assets/car_logo8_PNG.png";
import carLogo9 from "../../assets/car_logo9_PNG.png";
import carLogo10 from "../../assets/car_logo10_PNG.png";
import carLogo11 from "../../assets/car_logo11_PNG.png";
import carLogo12 from "../../assets/car_logo12_PNG.jpg";
import carLogo13 from "../../assets/car_logo13_PNG.png";
import carLogo14 from "../../assets/car_logo14_PNG.png";

const BannerAd = () => {
  const logos = [
    {
      src: carLogo1,
      alt: "Toyota",
    },
    {
      src: carLogo2,
      alt: "Honda",
    },
    {
      src: carLogo3,
      alt: "Ford",
    },
    {
      src: carLogo4,
      alt: "BMW",
    },
    {
      src: carLogo5,
      alt: "Mercedes-Benz",
    },
    {
      src: carLogo6,
      alt: "Audi",
    },
    {
      src: carLogo7,
      alt: "Volkswagen",
    },
    {
      src: carLogo8,
      alt: "Hyundai",
    },
    {
      src: carLogo9,
      alt: "Nissan",
    },
    {
      src: carLogo10,
      alt: "Kia",
    },
    {
      src: carLogo11,
      alt: "Mazda",
    },
    {
      src: carLogo12,
      alt: "Subaru",
    },
    {
      src: carLogo13,
      alt: "Volvo",
    },
    {
      src: carLogo14,
      alt: "Chevrolet",
      isLarge: true,
    },
  ];

  return (
    <section
      className="hidden md:block pt-0 pb-8 md:pt-1 md:pb-16 bg-white relative overflow-hidden"
      data-aos="fade-up"
      data-aos-delay="100"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h2
            className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 md:mb-4"
            style={{ color: colors.textPrimary }}
          >
            Our Trusted Partners
          </h2>
          <p
            className="text-sm md:text-base lg:text-lg px-2"
            style={{ color: colors.textSecondary }}
          >
            We work with leading brands to provide you the best experience
          </p>
        </div>
      </div>
      <div className="ticker-scroll-area w-full overflow-hidden">
        <div className="scroll-container items-center animate-ticker-scroll">
          {/* First set of logos */}
          {logos.map((logo, index) => (
            <div
              key={`first-${index}`}
              className="logo-wrap flex-shrink-0 flex items-center justify-center px-4 md:px-8"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className={
                  logo.isLarge
                    ? "h-14 md:h-16 w-auto opacity-60 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 max-h-14 md:max-h-16"
                    : "h-10 md:h-12 w-auto opacity-60 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 max-h-10 md:max-h-12"
                }
                loading="lazy"
              />
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {logos.map((logo, index) => (
            <div
              key={`second-${index}`}
              className="logo-wrap flex-shrink-0 flex items-center justify-center px-4 md:px-8"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className={
                  logo.isLarge
                    ? "h-14 md:h-16 w-auto opacity-60 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 max-h-14 md:max-h-16"
                    : "h-10 md:h-12 w-auto opacity-60 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 max-h-10 md:max-h-12"
                }
                loading="lazy"
              />
            </div>
          ))}
          {/* Third set for extra smoothness */}
          {logos.map((logo, index) => (
            <div
              key={`third-${index}`}
              className="logo-wrap flex-shrink-0 flex items-center justify-center px-4 md:px-8"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className={
                  logo.isLarge
                    ? "h-14 md:h-16 w-auto opacity-60 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 max-h-14 md:max-h-16"
                    : "h-10 md:h-12 w-auto opacity-60 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 max-h-10 md:max-h-12"
                }
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BannerAd;
