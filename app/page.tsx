import { Avatar, Box, Card, Flex, Text } from "@radix-ui/themes";
import { BlogPosts } from "app/components/posts";
import Image from "next/image";

export default function Page() {
    return (
        <section>
            <Box>
                <Card variant="ghost">
                    <Flex gap="5" align="center">
                        <Avatar
                            size="6"
                            src="/zach.jpg"
                            radius="medium"
                            fallback="Z"
                        />
                        <Box>
                            <Text as="div" size="5" weight="bold">
                                Zach Blume
                            </Text>
                            <Text as="div" size="3">
                                Software engineer and founder
                                {/* Software engineer at the{" "}
                                <a
                                    href="https://demexchange.com/"
                                    className="underline text-neutral-600 decoration-neutral-300"
                                >
                                    Democratic Data Exchange (DDx)
                                </a>
                                , and founder of{" "}
                                <a
                                    href="https://www.raisemore.app/"
                                    className="underline text-neutral-600 decoration-neutral-300"
                                >
                                    Raise More
                                </a>
                                . Bio at{" "}
                                <a
                                    href="https://github.com/zachblume"
                                    className="underline text-neutral-600 decoration-neutral-300"
                                >
                                    GitHub
                                </a>
                                . */}
                            </Text>
                        </Box>
                    </Flex>
                </Card>
            </Box>

            <SidewayScroll />

            <div className="mb-8 mt-6">
                <BlogPosts />
            </div>
        </section>
    );
}
function SidewayScroll() {
    return (
        <div className="relative w-full py-2 mt-3 flex ">
            <div className="flex space-x-[-160px]">
                <div className="w-[210px] h-[140px] transform transition-all duration-300 hover:scale-105 hover:translate-y-[-20px] hover:rotate-[-3deg] hover:z-30 relative">
                    <Image
                        alt=""
                        src="/waldo.jpeg"
                        width={210}
                        height={140}
                        className="h-[140px] rounded-lg"
                    />
                    <div className="absolute inset-0 flex   transition duration-300  rounded-lg">
                        <span className="text-white font-semibold text-lg ml-auto mr-3 mt-auto drop-shadow-md">
                            Waldo
                        </span>
                    </div>
                </div>
                <div className="w-[210px] h-[140px] transform transition-all duration-300 hover:scale-105 hover:translate-y-[-20px] hover:rotate-[-3deg] hover:z-30 relative">
                    <Image
                        alt=""
                        src="/millie.jpeg"
                        width={210}
                        height={140}
                        className="h-[140px] rounded-lg"
                    />
                    <div className="absolute inset-0 flex   transition duration-300  rounded-lg">
                        <span className="text-white font-semibold text-lg ml-auto mr-3 mt-auto drop-shadow-md">
                            Millie
                        </span>
                    </div>
                </div>
                <div className="w-[210px] h-[140px] transform transition-all duration-300 hover:scale-105 hover:translate-y-[-20px] hover:rotate-[-3deg] hover:z-30 relative">
                    <Image
                        alt=""
                        src="/luna.jpeg"
                        width={210}
                        height={140}
                        className="h-[140px] rounded-lg"
                    />
                    <div className="absolute inset-0 flex   transition duration-300  rounded-lg">
                        <span className="text-white font-semibold text-lg ml-auto mr-3 mt-auto drop-shadow-md">
                            Luna
                        </span>
                    </div>
                </div>{" "}
                <div className="block w-[350px] !h-[140px] transform transition-all duration-300 hover:scale-105 hover:translate-y-[-20px] hover:rotate-[-2deg] hover:z-30">
                    <div className="w-[350px] !h-[140px] py-4 px-5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-gray-800 ">
                        I live in NYC and work at{" "}
                        <a
                            href="https://www.stripe.com"
                            className="underline text-pink-500 decoration-pink-200 dark:decoration-pink-700"
                        >
                            Stripe
                        </a>{" "}
                        as a software engineer. I founded{" "}
                        <a
                            href="https://www.raisemore.app/"
                            className="underline text-pink-500 decoration-pink-200 dark:decoration-pink-700"
                        >
                            Raise More
                        </a>
                        , a modern CRM for political fundraising. My open source
                        work is on{" "}
                        <a
                            href="https://github.com/zachblume"
                            className="underline text-pink-500 decoration-pink-200 dark:decoration-pink-700"
                        >
                            GitHub
                        </a>
                        .
                    </div>
                </div>
            </div>
        </div>
    );
}
