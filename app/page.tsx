import { Avatar, Box, Button, Card, Flex, Text } from "@radix-ui/themes";
import { BlogPosts } from "app/components/posts";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
    return (
        <section>
            {/* <h1 className="mb-8 text-2xl font-semibold tracking-tight">
                Zach Blume
            </h1> */}
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
            {/* A placeholder element equal in size to the above: */}
            <div className="h-[170px]"> </div>

            <div className="my-8">
                <BlogPosts />
            </div>
        </section>
    );
}

function SidewayScroll() {
    return (
        <div className="overflow-x-auto fixed">
            <div className="flex space-x-10 py-6 justify-center">
                <div className="flex w-[350px] h-[150px] grayscale hover:grayscale-0 transition duration-300 !aspect-video">
                    <div className="bg-white py-4 px-5 rounded-lg m-0 border border-neutral-200">
                        I work at the{" "}
                        <a
                            href="https://demexchange.com/"
                            className="underline text-pink-600 decoration-pink-300"
                        >
                            Democratic Data Exchange (DDx)
                        </a>{" "}
                        as team lead for core infrastructure. I founded{" "}
                        <a
                            href="https://www.raisemore.app/"
                            className="underline text-pink-600 decoration-pink-300"
                        >
                            Raise More
                        </a>
                        , a refreshing CRM for politics. My open source work is
                        on{" "}
                        <a
                            href="https://github.com/zachblume"
                            className="underline text-pink-600 decoration-pink-300"
                        >
                            GitHub
                        </a>
                        .
                    </div>
                </div>

                <div className="w-[225px] h-[150px] grayscale hover:grayscale-0 transition duration-300 relative !aspect-video">
                    <Image
                        alt=""
                        src="/waldo.jpeg"
                        width={225}
                        height={150}
                        className="!h-[150px]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-300">
                        <span className="text-pink-100 font-bold text-lg mt-auto ml-auto mr-3">
                            Waldo
                        </span>
                    </div>
                </div>

                <div className="w-[225px] h-[150px] grayscale hover:grayscale-0 transition duration-300">
                    <Image
                        alt=""
                        src="/millie.jpeg"
                        width={225}
                        height={150}
                        className="!h-[150px]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-300">
                        <span className="text-pink-100 font-bold text-lg mt-auto ml-auto mr-3">
                            Millie
                        </span>
                    </div>
                </div>

                <div className="w-[225px] h-[150px] grayscale hover:grayscale-0 transition duration-300 relative !aspect-video">
                    <Image
                        alt=""
                        src="/luna.jpeg"
                        width={225}
                        height={150}
                        className="!h-[150px]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-300">
                        <span className="text-pink-100 font-bold text-lg mt-auto ml-auto mr-3">
                            Luna
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
