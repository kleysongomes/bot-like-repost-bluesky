import axios, { AxiosError } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const processedMentions = new Set<string>();
const processedHashtagPosts = new Set<string>();

const API_URL = 'https://bsky.social/xrpc';
const TWENTY_FIVE_MINUTES = 3600000; // 1 hora em milissegundos
const ONE_HOUR = 3600000; // 1 hora em milissegundos
const FIVE_SECONDS = 5000; // 5 segundos em milissegundos

const hashtags = ['#bolhadev', '#studytech', '#dev', '#studytwt', '#bolhasec', '#studysky'];

interface AccessTokenResponse {
  accessJwt: string;
  did: string;
}

interface Mention {
  cid: string;
  uri: string;
  reason: string;
}

interface Post {
  cid: string;
  uri: string;
}

async function getAccessToken(): Promise<{ token: string; did: string }> {
  const { data } = await axios.post<AccessTokenResponse>(`${API_URL}/com.atproto.server.createSession`, {
    identifier: process.env.IDENTIFIER,
    password: process.env.PASSWORD
  });

  return { token: data.accessJwt, did: data.did };
}

async function getMentions(token: string): Promise<Mention[]> {
  console.log('Buscando menções...');
  const { data } = await axios.get(`${API_URL}/app.bsky.notification.listNotifications`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const mentions = data.notifications.filter((notification: Mention) => notification.reason === 'mention');
  console.log(`Foram encontradas ${mentions.length} menções.`);
  return mentions;
}

async function repost(mention: Mention, token: string, did: string): Promise<void> {
  if (processedMentions.has(mention.cid)) {
    console.log(`Menção já repostada: ${mention.cid}`);
    return;
  }

  console.log(`Repostando menção: ${mention.cid}`);

  const repostData = {
    $type: 'app.bsky.feed.repost',
    repo: did,
    collection: 'app.bsky.feed.repost',
    record: {
      subject: {
        uri: mention.uri,
        cid: mention.cid
      },
      createdAt: new Date().toISOString()
    }
  };

  await axios.post(`${API_URL}/com.atproto.repo.createRecord`, repostData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  processedMentions.add(mention.cid);
  console.log(`Menção repostada com sucesso: ${mention.cid}`);
}

async function getHashtagPosts(token: string, hashtag: string): Promise<Post[]> {
  console.log(`Buscando posts com a hashtag ${hashtag}...`);
  const { data } = await axios.get(`${API_URL}/app.bsky.feed.searchPosts?q=${encodeURIComponent(hashtag)}&limit=25`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!data.posts) {
    console.error('Nenhum post foi encontrado. Resposta da API:', data);
    return [];
  }

  const posts = data.posts;
  console.log(`Foram encontrados ${posts.length} posts com a hashtag ${hashtag}.`);
  return posts;
}

async function likePost(post: Post, token: string, did: string): Promise<void> {
  if (processedHashtagPosts.has(post.cid)) {
    console.log(`Post já curtido: ${post.cid}`);
    return;
  }

  console.log(`Curtindo post: ${post.cid}`);

  const likeData = {
    $type: 'app.bsky.feed.like',
    repo: did,
    collection: 'app.bsky.feed.like',
    record: {
      subject: { uri: post.uri, cid: post.cid },
      createdAt: new Date().toISOString(),
    }
  };

  try {
    await axios.post(`${API_URL}/com.atproto.repo.createRecord`, likeData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    processedHashtagPosts.add(post.cid);
    console.log(`Post curtido com sucesso: ${post.cid}`);

    // Atraso de 5 segundos entre as curtidas
    await new Promise(resolve => setTimeout(resolve, FIVE_SECONDS));
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error(`Erro ao curtir post (Status ${error.response.status}):`, error.response.data);
      } else {
        console.error('Erro ao curtir post:', error.message);
      }
    } else {
      console.error('Erro desconhecido ao curtir post:', error);
    }
  }
}

async function processHashtags(token: string, did: string): Promise<void> {
  for (const hashtag of hashtags) {
    const posts = await getHashtagPosts(token, hashtag);

    if (posts.length === 0) {
      console.log(`Nenhum post encontrado com a hashtag ${hashtag}`);
    } else {
      for (const post of posts) {
        await likePost(post, token, did);
      }
    }
  }
}

async function main(): Promise<void> {
  try {
    const startTime = new Date().toLocaleTimeString();
    console.log(`Execução iniciada às ${startTime}`);

    const { token, did } = await getAccessToken();

    // Repostar menções
    const mentions = await getMentions(token);

    if (mentions.length === 0) {
      console.log('Nenhuma menção encontrada');
    } else {
      for (const mention of mentions) {
        await repost(mention, token, did);
      }
    }

    // Processar todas as hashtags
    await processHashtags(token, did);

    // Exibe o tempo restante para a próxima leitura
    const nextRunTime = new Date(Date.now() + TWENTY_FIVE_MINUTES).toLocaleTimeString();
    console.log(`Próxima leitura será às ${nextRunTime}`);

  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Erro na requisição:', error.message);
    } else if (error instanceof Error) {
      console.error('Erro:', error.message);
    } else {
      console.error('Ocorreu um erro inesperado:', error);
    }
  }
}

main();

setInterval(() => {
  main();
}, TWENTY_FIVE_MINUTES);

setInterval(() => {
  processedMentions.clear();
  processedHashtagPosts.clear();
  console.log('Limpeza dos registros de menções e posts com hashtag realizada');
}, ONE_HOUR);
