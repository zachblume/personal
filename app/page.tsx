import { Avatar, Box, Card, Flex, Text } from "@radix-ui/themes";
import { BlogPosts } from "app/components/posts";
import { EmailLink } from "app/components/EmailLink";
import Image from "next/image";

export default function Page() {
    return (
        <section>
            <Box>
                <Card
                    variant="ghost"
                    className="dark:bg-black border-0 dark:border dark:border-neutral-900/50 dark:shadow-xl dark:shadow-neutral-950/20"
                >
                    <Flex gap="5" align="center">
                        <Avatar
                            size="6"
                            src="/zach.jpg"
                            radius="medium"
                            fallback="Z"
                            className="ring-1 ring-neutral-200 dark:ring-0 dark:shadow-lg dark:shadow-black/50"
                        />
                        <Box>
                            <Text
                                as="div"
                                size="5"
                                weight="bold"
                                className="text-neutral-900 dark:text-neutral-50 dark:font-semibold"
                            >
                                Zach Blume
                            </Text>
                            <Text
                                as="div"
                                size="3"
                                className="text-neutral-600 dark:text-neutral-500"
                            >
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
            <div className="flex space-x-[-190px]">
                <div className="group relative">
                    <div className="w-[233px] h-[155px] transform transition-all duration-500 ease-out delay-75 group-hover:scale-105 group-hover:translate-y-[-20px] group-hover:rotate-[-3deg] group-hover:z-30 relative origin-center dark:group-hover:shadow-2xl dark:group-hover:shadow-neutral-900/50">
                        <Image
                            alt=""
                            src="/waldo.jpeg"
                            width={233}
                            height={155}
                            className="h-[155px] rounded-lg dark:brightness-90 dark:contrast-125"
                        />
                        <div className="absolute inset-0 flex transition duration-300 rounded-lg bg-gradient-to-t from-black/50 to-transparent dark:from-black/70">
                            <span className="text-white font-semibold text-lg ml-auto mr-3 mt-auto mb-2 drop-shadow-lg">
                                Waldo
                            </span>
                        </div>
                    </div>
                </div>
                <div className="group relative">
                    <div className="w-[233px] h-[155px] transform transition-all duration-500 ease-out delay-75 group-hover:scale-105 group-hover:translate-y-[-20px] group-hover:rotate-[-3deg] group-hover:z-30 relative origin-center dark:group-hover:shadow-2xl dark:group-hover:shadow-neutral-900/50">
                        <Image
                            alt=""
                            src="/millie.jpeg"
                            width={233}
                            height={155}
                            className="h-[155px] rounded-lg dark:brightness-90 dark:contrast-125"
                        />
                        <div className="absolute inset-0 flex transition duration-300 rounded-lg bg-gradient-to-t from-black/50 to-transparent dark:from-black/70">
                            <span className="text-white font-semibold text-lg ml-auto mr-3 mt-auto mb-2 drop-shadow-lg">
                                Millie
                            </span>
                        </div>
                    </div>
                </div>
                <div className="group relative">
                    <div className="w-[233px] h-[155px] transform transition-all duration-500 ease-out delay-75 group-hover:scale-105 group-hover:translate-y-[-20px] group-hover:rotate-[-3deg] group-hover:z-30 relative origin-center dark:group-hover:shadow-2xl dark:group-hover:shadow-neutral-900/50">
                        <Image
                            alt=""
                            src="/luna.jpeg"
                            width={233}
                            height={155}
                            className="h-[155px] rounded-lg dark:brightness-90 dark:contrast-125"
                        />
                        <div className="absolute inset-0 flex transition duration-300 rounded-lg bg-gradient-to-t from-black/50 to-transparent dark:from-black/70">
                            <span className="text-white font-semibold text-lg ml-auto mr-3 mt-auto mb-2 drop-shadow-lg">
                                Luna
                            </span>
                        </div>
                    </div>
                </div>{" "}
                <div className="group relative block">
                    <div className="block w-[350px] !h-[155px] transform transition-all duration-300 ease-out delay-75 group-hover:scale-105 group-hover:translate-y-[-20px] group-hover:rotate-[-2deg] group-hover:z-30 origin-center">
                        <div className="w-[350px] !h-[155px] py-4 px-5 rounded-xl border border-neutral-200 dark:border-neutral-800/50 bg-white dark:bg-black dark:bg-gradient-to-b dark:from-neutral-900/20 dark:to-black text-neutral-900 dark:text-neutral-300 shadow-sm dark:shadow-2xl dark:shadow-neutral-900/50">
                            I live in NYC and work at{" "}
                            <a
                                href="https://www.stripe.com"
                                className="text-neutral-900 dark:text-white font-medium underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-2 hover:decoration-neutral-500 dark:hover:decoration-neutral-500 transition-colors"
                            >
                                Stripe
                            </a>{" "}
                            as a software engineer. I founded{" "}
                            <a
                                href="https://www.raisemore.app/"
                                className="text-neutral-900 dark:text-white font-medium underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-2 hover:decoration-neutral-500 dark:hover:decoration-neutral-500 transition-colors"
                            >
                                Raise More
                            </a>
                            , a modern CRM for political fundraising. My open
                            source work is on{" "}
                            <a
                                href="https://github.com/zachblume"
                                className="text-neutral-900 dark:text-white font-medium underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-2 hover:decoration-neutral-500 dark:hover:decoration-neutral-500 transition-colors"
                            >
                                GitHub
                            </a>
                            . Get in touch at <EmailLink />.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
