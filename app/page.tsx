import { Avatar, Box, Card, Flex, Text } from "@radix-ui/themes";
import { BlogPosts } from "app/components/posts";
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
                            <Text as="div" size="3" color="gray">
                                This is where my writing lives. Bio at{" "}
                                <Link
                                    href="https://github.com/zachblume/"
                                    className="underline-link"
                                >
                                    GitHub
                                </Link>
                                .
                            </Text>
                        </Box>
                    </Flex>
                </Card>
            </Box>

            <div className="my-8">
                <BlogPosts />
            </div>
        </section>
    );
}
