import React, { useState } from "react";

import "./FAQ.css";
import Button from "../other/Button";
import useResponsive from "../../hooks/useResponsive";
import GridPosts from "./FAQ/GridPosts";
import AccordionPosts from "./FAQ/AccordionPosts";

const FAQ = () => {
  const { isTabletWidth } = useResponsive();
  const stopIndex = isTabletWidth ? 3 : 5;
  const [showMore, setShowMore] = useState(false);

  return (
    <section className="faq">
      <h2 className="faq__title">F.A.Q.</h2>
      {isTabletWidth ? (
        <AccordionPosts faq={faq} showMore={showMore} stopIndex={stopIndex} />
      ) : (
        <GridPosts faq={faq} showMore={showMore} stopIndex={stopIndex} />
      )}
      {!showMore && (
        <Button
          className="faq__load-more"
          variant="outlined"
          onClick={setShowMore.bind(null, true)}
        >
          More
        </Button>
      )}
    </section>
  );
};

const faq = [
  {
    title: "What is liquity?",
    description:
      "The Panoptic liquidity provider (PLP) provides fungible liquidity to the Panoptic pool and receives commission fees in return. This differs from the liquidity provider (LP) who deploys liquidity in a Uniswap V3 pool and receives swap fees in return. The option seller borrows liquidity from the PLP to deploy in a Uniswap V3 pool as an LP.",
    link: "/",
  },
  {
    title: "How can I use liquity?",
    description:
      "The Panoptic liquidity provider (PLP) provides fungible liquidity to the Panoptic pool and receives commission fees in return. This differs from the liquidity provider (LP) who deploys liquidity in a Uniswap V3 pool and receives swap fees in return.",
    link: "/",
  },
  {
    title: "What are the key benefits of liquity?",
    link: "/",
  },
  {
    title: "How can I earn money on liquity?",
    link: "/",
  },
  {
    title: "How can I use liquity?",
    description:
      "The Panoptic liquidity provider (PLP) provides fungible liquidity to the Panoptic pool and receives commission fees in return. This differs from the liquidity provider (LP) who deploys liquidity in a Uniswap V3 pool and receives swap fees in return. ",
    link: "/",
  },
  {
    title: "How can I earn money on liquity?",
    link: "/",
  },
];

export default FAQ;
